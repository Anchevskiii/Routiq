import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';
import { Observable, Subject } from 'rxjs';
import { ConfigService } from '../config/config.service';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly baseUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.getGeminiApiKey();
  }

  private getApiKeyOrThrow(): string {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('Gemini API is not configured');
    }
    return this.apiKey;
  }

  async streamGenerate(prompt: string): Promise<unknown> {
    const url = `${this.baseUrl}?key=${this.getApiKeyOrThrow()}`;

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
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    };

    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 20000, // 20 seconds timeout
      });

      let fullResponse = '';
      const chunks: Array<{ type: string; content: string }> = [];

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.slice(6));

                if (
                  jsonData.candidates &&
                  jsonData.candidates[0]?.content?.parts
                ) {
                  const text = jsonData.candidates[0].content.parts[0].text;
                  fullResponse += text;

                  chunks.push({
                    type: 'chunk',
                    content: text,
                  });
                }
              } catch {
                this.logger.warn(`Failed to parse chunk: ${line}`);
              }
            }
          }
        });

        response.data.on('end', () => {
          try {
            // Parse the complete response as JSON
            const itineraryData = JSON.parse(fullResponse);
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
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new ServiceUnavailableException(
            'AI generation timeout. Please try again.',
          );
        }

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            throw new ServiceUnavailableException(
              'AI service rate limit exceeded. Please try again later.',
            );
          }

          if (error.response?.status === 403) {
            throw new ServiceUnavailableException(
              'AI service authentication failed. Check API key configuration.',
            );
          }

          throw new ServiceUnavailableException(
            `AI service error: ${error.message}`,
          );
        }
      }

      throw new ServiceUnavailableException(
        'Failed to generate itinerary. Please try again.',
      );
    }
  }

  async generateText(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.getApiKeyOrThrow()}`;

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
        maxOutputTokens: 8192,
      },
    };

    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000, // 20 seconds timeout
      });

      if (
        response.data.candidates &&
        response.data.candidates[0]?.content?.parts
      ) {
        return response.data.candidates[0].content.parts[0].text;
      }

      throw new Error('Invalid response from AI service');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new ServiceUnavailableException(
            'AI generation timeout. Please try again.',
          );
        }

        if (axios.isAxiosError(error)) {
          if (error.response?.status === 429) {
            throw new ServiceUnavailableException(
              'AI service rate limit exceeded. Please try again later.',
            );
          }

          throw new ServiceUnavailableException(
            `AI service error: ${error.message}`,
          );
        }
      }

      throw new ServiceUnavailableException(
        'Failed to generate text. Please try again.',
      );
    }
  }

  /**
   * Generates content as an Observable stream for SSE.
   */
  streamGenerateObservable(prompt: string): Observable<any> {
    const subject = new Subject<any>();
    const url = `${this.baseUrl}?key=${this.getApiKeyOrThrow()}`;

    const requestBody = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    };

    axios
      .post(url, requestBody, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'stream',
        timeout: 20000,
      })
      .then((response) => {
        let fullResponse = '';
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonData = JSON.parse(line.slice(6));
                if (jsonData.candidates?.[0]?.content?.parts?.[0]?.text) {
                  const text = jsonData.candidates[0].content.parts[0].text;
                  fullResponse += text;
                  subject.next({ type: 'chunk', content: text });
                }
              } catch {
                // Ignore partial parse errors
              }
            }
          }
        });

        response.data.on('end', () => {
          try {
            const itineraryData = JSON.parse(fullResponse);
            subject.next({ type: 'complete', data: itineraryData });
            subject.complete();
          } catch {
            subject.error(new Error('Failed to parse AI response'));
          }
        });

        response.data.on('error', (err: any) => subject.error(err));
      })
      .catch((err) => subject.error(err));

    return subject.asObservable();
  }
}
