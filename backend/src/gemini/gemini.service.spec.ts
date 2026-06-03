import { ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
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

      const events: any[] = [];
      service.streamGenerateObservable('Get itinerary').subscribe({
        next: (ev) => events.push(ev),
        error: (err) => done(err),
        complete: () => {
          expect(events.length).toBeGreaterThan(0);
          const completeEvent = events.find((ev) => ev.type === 'complete');
          expect(completeEvent).toBeDefined();
          expect(completeEvent.data).toEqual({ theme: 'Sightseeing' });
          done();
        },
      });
    });
  });
});
