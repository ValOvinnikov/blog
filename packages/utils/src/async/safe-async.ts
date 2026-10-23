import { errorResult, okResult, type TResult } from '@blog/utils/result';

export function safeAsync<A extends unknown[], T>(
  fn: (...args: A) => Promise<T>,
): (...args: A) => Promise<TResult<T>> {
  return async (...args: A) => {
    try {
      return okResult(await fn(...args));
    } catch (error) {
      return errorResult(error);
    }
  };
}
