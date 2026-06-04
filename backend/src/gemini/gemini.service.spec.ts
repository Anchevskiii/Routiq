import { ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { withRetry } from '../common';
import { AppConfigService } from '../config/config.service';
import { GeminiService } from './gemini.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../common', () => {
  const original = jest.requireActual('../common');
  return {
    ...original,
    withRetry: jest.fn().mockImplementation((fn) => fn()),
  };
});

describe('GeminiService', () => {
  let service: GeminiService;
  let mockConfigService: {
    getGeminiApiKey: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.isAxiosError.mockImplementation((err: unknown) => {
      return (
        typeof err === 'object' &&
        err !== null &&
        'isAxiosError' in err &&
        (err as { isAxiosError: boolean }).isAxiosError === true
      );
    });
    mockConfigService = {
      getGeminiApiKey: jest.fn().mockReturnValue('fake-gemini-key'),
    };
    service = new GeminiService(
      mockConfigService as unknown as AppConfigService,
    );
  });

  describe('getApiKeyOrThrow', () => {
    it('should throw ServiceUnavailableException if apiKey is not configured', () => {
      mockConfigService.getGeminiApiKey.mockReturnValue(null);
      const invalidService = new GeminiService(
        mockConfigService as unknown as AppConfigService,
      );
      expect(() => invalidService['getApiKeyOrThrow']()).toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('generateText', () => {
    it('should call axios.post and return the generated text', async () => {
      mockedAxios.post.mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Hello, user!' }],
              },
            },
          ],
        },
      });

      const result = await service.generateText('Say hello');
      expect(result).toBe('Hello, user!');
      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should throw ServiceUnavailableException if axios call fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));
      await expect(service.generateText('Say hello')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('streamGenerate', () => {
    it('should collect stream data and resolve with parsed JSON', async () => {
      const responseData = [
        {
          candidates: [
            {
              content: {
                parts: [{ text: '{"theme": ' }],
              },
            },
          ],
        },
        {
          candidates: [
            {
              content: {
                parts: [{ text: '"Sightseeing"}' }],
              },
            },
          ],
        },
      ];

      const mockStream = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from(JSON.stringify(responseData)));
          } else if (event === 'end') {
            callback();
          }
        }),
      };

      mockedAxios.post.mockResolvedValue({ data: mockStream });

      const result = await service.streamGenerate('Get itinerary');
      expect(result).toEqual({ theme: 'Sightseeing' });
    });

    it('should reject if stream data is malformed JSON', async () => {
      const mockStream = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('not-json'));
          } else if (event === 'end') {
            callback();
          }
        }),
      };

      mockedAxios.post.mockResolvedValue({ data: mockStream });

      await expect(service.streamGenerate('Get itinerary')).rejects.toThrow(
        'Failed to parse AI response as valid JSON',
      );
    });
  });

  describe('streamGenerateObservable', () => {
    it('should yield chunks and complete with parsed JSON', (done) => {
      const chunk1 = {
        candidates: [{ content: { parts: [{ text: '{"theme":' }] } }],
      };
      const chunk2 = {
        candidates: [{ content: { parts: [{ text: '"Sightseeing"}' }] } }],
      };

      const mockStream = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from(JSON.stringify([chunk1, chunk2])));
          } else if (event === 'end') {
            callback();
          }
        }),
      };

      mockedAxios.post.mockResolvedValue({ data: mockStream });

      interface StreamEvent {
        type: string;
        data?: unknown;
      }
      const events: StreamEvent[] = [];
      service.streamGenerateObservable('Get itinerary').subscribe({
        next: (ev) => events.push(ev),
        error: (err) => done(err),
        complete: () => {
          expect(events.length).toBeGreaterThan(0);
          const completeEvent = events.find((ev) => ev.type === 'complete');
          expect(completeEvent).toBeDefined();
          expect(completeEvent?.data).toEqual({ theme: 'Sightseeing' });
          done();
        },
      });
    });
  });

  describe('handleGeminiError and shouldRetry', () => {
    it('should test shouldRetry function inside streamGenerate and generateText', async () => {
      const mockedWithRetry = withRetry as jest.Mock;

      mockedAxios.post.mockResolvedValue({ data: {} });
      await service.generateText('Say hello').catch(() => {});

      const generateTextOptions = mockedWithRetry.mock.calls[0][1];
      const mockError429 = Object.assign(new Error('rate limit'), {
        isAxiosError: true,
        response: { status: 429 },
      });
      const mockError400 = Object.assign(new Error('bad request'), {
        isAxiosError: true,
        response: { status: 400 },
      });
      const mockGenericError = new Error('generic');

      expect(generateTextOptions.shouldRetry(mockError429)).toBe(true);
      expect(generateTextOptions.shouldRetry(mockError400)).toBe(false);
      expect(generateTextOptions.shouldRetry(mockGenericError)).toBe(true);
    });

    it('should handle timeout, 429, 403, and generic errors in handleGeminiError', () => {
      const timeoutError = new Error('timeout error');
      const errThrottler = service['handleGeminiError'](timeoutError);
      expect(errThrottler.message).toContain('timeout');

      const serviceUnavailable = new ServiceUnavailableException('passthrough');
      const errPassthrough = service['handleGeminiError'](serviceUnavailable);
      expect(errPassthrough.message).toBe('passthrough');

      const axios429 = Object.assign(new Error('rate limit'), {
        isAxiosError: true,
        response: { status: 429 },
      });
      const err429 = service['handleGeminiError'](axios429);
      expect(err429.message).toContain('rate limit exceeded');

      const axios403 = Object.assign(new Error('auth error'), {
        isAxiosError: true,
        response: { status: 403 },
      });
      const err403 = service['handleGeminiError'](axios403);
      expect(err403.message).toContain('authentication failed');

      const genericAxios = Object.assign(new Error('custom error'), {
        isAxiosError: true,
        response: { status: 500 },
      });
      const errGenericAxios = service['handleGeminiError'](genericAxios);
      expect(errGenericAxios.message).toContain('custom error');
    });

    it('should throw invalid response error if response format is unexpected', async () => {
      mockedAxios.post.mockResolvedValue({ data: {} });
      await expect(service.generateText('test')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('streamGenerate error and recovery cases', () => {
    it('should reject streamGenerate if stream throws error', async () => {
      const mockStream = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'error') {
            callback(new Error('Stream crash'));
          }
        }),
      };
      mockedAxios.post.mockResolvedValue({ data: mockStream });
      await expect(service.streamGenerate('test')).rejects.toThrow(
        'AI service error',
      );
    });

    it('should attempt recovery on streamGenerateObservable when final JSON is malformed but recoverable', (done) => {
      const mockStream = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'data') {
            callback(
              Buffer.from(
                '{"candidates": [{"content": {"parts": [{"text": "{\\"theme\\": \\"Sightseeing\\""}]}}]}',
              ),
            );
          } else if (event === 'end') {
            callback();
          }
        }),
      };
      mockedAxios.post.mockResolvedValue({ data: mockStream });

      interface StreamEvent {
        type: string;
        data?: unknown;
      }
      const events: StreamEvent[] = [];
      service.streamGenerateObservable('Get itinerary').subscribe({
        next: (ev) => events.push(ev),
        error: (err) => done(err),
        complete: () => {
          const completeEvent = events.find((ev) => ev.type === 'complete');
          expect(completeEvent).toBeDefined();
          expect(completeEvent?.data).toEqual({ theme: 'Sightseeing' });
          done();
        },
      });
    });

    it('should throw error on streamGenerateObservable if recovery also fails', (done) => {
      const mockStream = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'data') {
            callback(
              Buffer.from(
                '{"candidates": [{"content": {"parts": [{"text": "invalid-garbage"}]}}]}',
              ),
            );
          } else if (event === 'end') {
            callback();
          }
        }),
      };
      mockedAxios.post.mockResolvedValue({ data: mockStream });

      service.streamGenerateObservable('Get itinerary').subscribe({
        next: () => {},
        error: (err) => {
          expect(err.message).toContain('Failed to parse AI response');
          done();
        },
        complete: () => {
          done(new Error('Should not complete successfully'));
        },
      });
    });

    it('should handle axios errors with response stream inside streamGenerateObservable', (done) => {
      const mockErrorStream = {
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('Internal error body'));
          } else if (event === 'end') {
            callback();
          }
        }),
      };
      const axiosError = {
        isAxiosError: true,
        message: 'Request failed',
        response: {
          status: 500,
          data: mockErrorStream,
        },
      };

      mockedAxios.post.mockRejectedValue(axiosError);

      service.streamGenerateObservable('Get itinerary').subscribe({
        next: () => {},
        error: (err) => {
          expect(err).toBeDefined();
          done();
        },
        complete: () => {
          done(new Error('Should not complete successfully'));
        },
      });
    });
  });
});
