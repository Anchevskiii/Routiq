import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';
import { Observable, Subject, timeout } from 'rxjs';
import { AppConfigService } from '../config/config.service';

export type GeminiStreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'complete'; data: unknown };

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';
  private static readonly STREAM_TIMEOUT_MS = 180_000;

  constructor(private readonly configService: AppConfigService) {
    this.apiKey = this.configService.getGeminiApiKey();
  }

  private getApiKeyOrThrow(): string {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('Gemini API is not configured');
    }
    return this.apiKey;
  }

  async streamGenerate(prompt: string): Promise<GeneratedItineraryResponse> {
    const url = `${this.baseUrl}?key=${this.getApiKeyOrThrow()}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    };

    try {
      const response = await axios.post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'stream',
        timeout: GeminiService.STREAM_TIMEOUT_MS,
      });

      let rawBuffer = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          rawBuffer += chunk.toString();
        });

        response.data.on('end', () => {
          try {
            const textRegex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
            let match;
            let fullText = '';
            while ((match = textRegex.exec(rawBuffer)) !== null) {
              fullText += match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }

            const itineraryData = JSON.parse(
              fullText,
            ) as GeneratedItineraryResponse;
            resolve(itineraryData);
          } catch {
            reject(new Error('Failed to parse AI response as valid JSON'));
          }
        });

        response.data.on('error', (error: Error) => {
          reject(
            new ServiceUnavailableException(
              `AI service error: ${error.message}`,
            ),
          );
        });
      });
    } catch (error) {
      throw this.handleGeminiError(error);
    }
  }

  async generateText(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.getApiKeyOrThrow()}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
      },
    };

    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: GeminiService.STREAM_TIMEOUT_MS,
      });

      if (
        response.data.candidates &&
        response.data.candidates[0]?.content?.parts
      ) {
        return response.data.candidates[0].content.parts[0].text;
      }

      throw new Error('Invalid response from AI service');
    } catch (error) {
      throw this.handleGeminiError(error);
    }
  }

  /**
   * Generates content as an Observable stream for SSE.
   */
  streamGenerateObservable(prompt: string): Observable<GeminiStreamEvent> {
    const subject = new Subject<GeminiStreamEvent>();
    const url = `${this.baseUrl}?key=${this.getApiKeyOrThrow()}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    };

    axios
      .post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'stream',
        // Increased timeout to 120s as requested
        timeout: GeminiService.STREAM_TIMEOUT_MS,
      })
      .then((response) => {
        let rawBuffer = '';
        let lastEmittedLength = 0;

        response.data.on('data', (chunk: Buffer) => {
          rawBuffer += chunk.toString();

          // Try to extract text parts from the current buffer state
          // Gemini REST stream format is a JSON array of objects
          // Each object has candidates[0].content.parts[0].text
          try {
            // This regex finds the "text" values in the JSON stream
            const textRegex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
            let match;
            let fullExtractedText = '';

            while ((match = textRegex.exec(rawBuffer)) !== null) {
              // Unescape the JSON string
              const text = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
              fullExtractedText += text;
            }

            if (fullExtractedText.length > lastEmittedLength) {
              const newContent = fullExtractedText.slice(lastEmittedLength);
              subject.next({ type: 'chunk', content: newContent });
              lastEmittedLength = fullExtractedText.length;
            }
          } catch {
            // Silently ignore partial parse errors during streaming
          }
        });

        response.data.on('end', () => {
          try {
            // Extract final full text for the 'complete' event
            const textRegex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
            let match;
            let fullText = '';
            while ((match = textRegex.exec(rawBuffer)) !== null) {
              fullText += match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            }

            const itineraryData = JSON.parse(fullText);
            subject.next({ type: 'complete', data: itineraryData });
            subject.complete();
          } catch {
            this.logger.error(
              `Final parse failed. Buffer length: ${rawBuffer.length}`,
            );
            subject.error(
              new Error('Failed to parse AI response as valid JSON'),
            );
          }
        });

        response.data.on('error', (err: unknown) => subject.error(err));
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Gemini API error: ${err instanceof Error ? err.message : String(err)}`,
        );
        subject.error(this.handleGeminiError(err));
      });

    return subject
      .asObservable()
      .pipe(timeout(GeminiService.STREAM_TIMEOUT_MS));
  }

  private handleGeminiError(error: unknown): ServiceUnavailableException {
    if (error instanceof ServiceUnavailableException) {
      return error;
    }
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return new ServiceUnavailableException(
          'AI generation timeout. Please try again.',
        );
      }

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          return new ServiceUnavailableException(
            'AI service rate limit exceeded. Please try again later.',
          );
        }

        if (error.response?.status === 403) {
          return new ServiceUnavailableException(
            'AI service authentication failed. Check API key configuration.',
          );
        }

        return new ServiceUnavailableException(
          `AI service error: ${error.message}`,
        );
      }
    }

    return new ServiceUnavailableException(
      'Failed to generate itinerary. Please try again.',
    );
  }
}

export interface GeneratedItineraryResponse {
  summary?: {
    destination?: string;
    totalDays?: number;
    travelType?: string;
    bestSeason?: string;
    estimatedBudget?: string;
  };
  days?: Array<{
    day: number;
    date?: string;
    theme?: string;
    weather?: {
      condition?: string;
      temperature?: string;
      recommendations?: string;
    };
    activities?: Array<{
      time?: string;
      title: string;
      description?: string;
      location?: string;
      placeId?: string;
      duration?: number | string;
      cost?: string;
      tips?: string;
      coordinates?: { lat?: number; lng?: number };
    }>;
    meals?: Array<{
      type?: string;
      recommendation?: string;
      location?: string;
      priceRange?: string;
    }>;
    transportation?: {
      method?: string;
      estimatedCost?: string;
      notes?: string;
    };
  }>;
  generalTips?: string[];
}
