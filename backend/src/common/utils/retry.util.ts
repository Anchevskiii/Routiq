import { Logger } from '@nestjs/common';
import { randomInt } from 'node:crypto';

export interface RetryOptions {
  maxRetries?: number;
  backoffMs?: number;
  maxBackoffMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const logger = new Logger('RetryUtility');

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export class RetryExhaustedError extends Error {
  public readonly lastError: unknown;

  constructor(message: string, lastError: unknown) {
    super(message);
    this.name = 'RetryExhaustedError';
    this.lastError = lastError;
  }
}

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

      if (!shouldRetry(error)) {
        logger.warn(
          `Operation failed with non-retryable error on attempt ${attempt}/${maxRetries}: ${formatError(error)}`,
        );
        break;
      }

      if (attempt > maxRetries) {
        logger.error(
          `Operation exhausted after ${maxRetries} retries. Last error: ${formatError(error)}`,
        );
        break;
      }

      const delay = Math.min(
        backoffMs * Math.pow(2, attempt - 1),
        maxBackoffMs,
      );
      const jitter = randomInt(0, 200);
      const finalDelay = delay + jitter;

      logger.warn(
        `Operation failed. Attempt ${attempt}/${maxRetries}. Retrying in ${Math.round(finalDelay)}ms... Error: ${formatError(error)}`,
      );

      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }

  throw new RetryExhaustedError(
    `Operation failed after ${maxRetries} retries: ${formatError(lastError)}`,
    lastError,
  );
}
