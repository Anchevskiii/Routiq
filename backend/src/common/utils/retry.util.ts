import { Logger } from '@nestjs/common';

export interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const logger = new Logger('RetryUtility');

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const backoffMs = options.backoffMs ?? 1000;
  const maxBackoffMs = options.maxBackoffMs ?? 10000;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;
      if (attempt > maxRetries || !shouldRetry(error)) {
        break;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        backoffMs * Math.pow(2, attempt - 1),
        maxBackoffMs,
      );
      const jitter = Math.random() * 200;
      const finalDelay = delay + jitter;

      logger.warn(
        `Operation failed. Attempt ${attempt}/${maxRetries}. Retrying in ${Math.round(finalDelay)}ms... Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError;
}
