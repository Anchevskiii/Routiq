import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';
import { Observable, Subject, timeout } from 'rxjs';
import { AppConfigService } from '../config/config.service';
import { withRetry } from '../common';
import { tryParseGeminiResponse } from './parse-response';

export type GeminiStreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'complete'; data: unknown };

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
}

interface GeminiStreamItem {
  candidates?: GeminiCandidate[];
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent';
  private static readonly STREAM_TIMEOUT_MS = 60_000;
  private readonly apiKeyInUrlRegex = /key=[^&\s"]+/g;

  constructor(private readonly configService: AppConfigService) {
    this.apiKey = this.configService.getGeminiApiKey();
  }

  private getApiKeyOrThrow(): string {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('Gemini API is not configured');
    }
    return this.apiKey;
  }

  private redactSensitiveInfo(message: string): string {
    return message.replace(this.apiKeyInUrlRegex, 'key=REDACTED');
  }

  async streamGenerate(prompt: string): Promise<unknown> {
    const url = `${this.baseUrl}?key=${this.getApiKeyOrThrow()}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 1.0,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseSchema: this.getItinerarySchema(),
      },
    };

    try {
      const response = await withRetry(
        () =>
          axios.post(url, requestBody, {
            headers: { 'Content-Type': 'application/json' },
            responseType: 'stream',
            timeout: GeminiService.STREAM_TIMEOUT_MS,
          }),
        {
          shouldRetry: (error) => {
            if (axios.isAxiosError(error)) {
              return (
                !error.response ||
                error.response.status === 429 ||
                error.response.status >= 500
              );
            }
            return true;
          },
        },
      );

      let rawBuffer = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          rawBuffer += chunk.toString();
        });

        response.data.on('end', () => {
          const result = tryParseGeminiResponse(
            rawBuffer,
            rawBuffer,
            this.logger,
          );
          if (result.success) {
            resolve(result.data);
          } else {
            this.logger.error(`Stream parse failed: ${result.error.message}`);
            reject(result.error);
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${this.getApiKeyOrThrow()}`;

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
      const response = await withRetry(
        () =>
          axios.post(url, requestBody, {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: GeminiService.STREAM_TIMEOUT_MS,
          }),
        {
          shouldRetry: (error) => {
            if (axios.isAxiosError(error)) {
              return (
                !error.response ||
                error.response.status === 429 ||
                error.response.status >= 500
              );
            }
            return true;
          },
        },
      );

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
    const startTime = Date.now();
    this.logger.log(
      `[PERF] Gemini Stream started at ${new Date(startTime).toISOString()}. Prompt length: ${prompt.length}`,
    );

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
        responseSchema: this.getItinerarySchema(),
      },
    };

    axios
      .post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'stream',
        timeout: GeminiService.STREAM_TIMEOUT_MS,
      })
      .then((response) => {
        const firstByteTime = Date.now();
        this.logger.log(
          `[PERF] Gemini Stream first response after ${firstByteTime - startTime}ms`,
        );

        let rawBuffer = '';
        let lastExtractedText = '';
        let chunkCount = 0;

        response.data.on('data', (chunk: Buffer) => {
          chunkCount++;
          rawBuffer += chunk.toString();

          // Gemini Stream format:
          // [
          //   {"candidates": [{"content": {"parts": [{"text": "..."}]}}]},
          //   {"candidates": [{"content": {"parts": [{"text": "..."}]}}]}
          // ]
          // We need to extract text without fully parsing the array (it's incomplete)

          try {
            const textRegex = /"text":\s*"((?:[^"\\]|\\.)*)"/g;
            let match;
            let currentFullText = '';

            while ((match = textRegex.exec(rawBuffer)) !== null) {
              try {
                // Use JSON.parse to correctly handle all escape sequences
                const text = JSON.parse(`"${match[1]}"`);
                currentFullText += text;
              } catch {
                // If parsing fails (e.g. partial escape sequence at end of chunk),
                // we'll catch it in the next chunk.
                continue;
              }
            }

            if (currentFullText.length > lastExtractedText.length) {
              const newDelta = currentFullText.slice(lastExtractedText.length);
              subject.next({ type: 'chunk', content: newDelta });
              lastExtractedText = currentFullText;
            }
          } catch {
            // Partial text extraction failed, wait for next chunk
          }
        });

        response.data.on('end', () => {
          const endTime = Date.now();
          this.logger.log(
            `[PERF] Gemini Stream ended after ${endTime - startTime}ms. Chunks: ${chunkCount}. Text length: ${lastExtractedText.length}`,
          );

          const result = tryParseGeminiResponse(
            rawBuffer,
            lastExtractedText,
            this.logger,
          );
          if (result.success) {
            subject.next({ type: 'complete', data: result.data });
            subject.complete();
          } else {
            subject.error(result.error);
          }
        });

        response.data.on('error', (err: unknown) => subject.error(err));
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Gemini API error: ${err instanceof Error ? err.message : String(err)}`,
        );
        if (axios.isAxiosError(err) && err.response?.data) {
          const chunks: Buffer[] = [];
          err.response.data.on('data', (c: Buffer) => chunks.push(c));
          err.response.data.on('end', () => {
            this.logger.error(
              `Gemini error body: ${Buffer.concat(chunks).toString()}`,
            );
          });
        }
        subject.error(this.handleGeminiError(err));
      });

    return subject
      .asObservable()
      .pipe(timeout(GeminiService.STREAM_TIMEOUT_MS));
  }

  private getItinerarySchema() {
    return {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          day: { type: 'INTEGER' },
          theme: { type: 'STRING' },
          activities: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                placeId: { type: 'STRING' },
                title: { type: 'STRING' },
                time: { type: 'STRING' },
                duration: { type: 'NUMBER' },
                type: { type: 'STRING', enum: ['attraction', 'restaurant'] },
              },
              required: ['placeId', 'title', 'time', 'duration', 'type'],
            },
          },
        },
        required: ['day', 'theme', 'activities'],
      },
    };
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
          `AI service error: ${this.redactSensitiveInfo(error.message)}`,
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
