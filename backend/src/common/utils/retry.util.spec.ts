import { withRetry } from './retry.util';

describe('withRetry', () => {
  it('should return value if fn succeeds immediately', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry and succeed if fn fails and then succeeds', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success');
    const result = await withRetry(fn, { backoffMs: 1 });
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw error after maxRetries is reached', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(
      withRetry(fn, { maxRetries: 2, backoffMs: 1 }),
    ).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial attempt + 2 retries
  });

  it('should stop retrying if shouldRetry returns false', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('special-fail'));
    const shouldRetry = jest.fn().mockReturnValue(false);
    await expect(
      withRetry(fn, { maxRetries: 3, backoffMs: 1, shouldRetry }),
    ).rejects.toThrow('special-fail');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });
});
