import type { TMaybeUndefined } from '@shinefold/config';
import { unstable_isUnrecognizedActionError } from 'next/navigation';

const listeners = new Set<() => void>();

export const subscribeToPageOutOfDate = (onOutOfDate: () => void) => {
  listeners.add(onOutOfDate);
  return () => {
    listeners.delete(onOutOfDate);
  };
};

// An unrecognised action means this page's build is gone.
export const unlessPageOutOfDate = <TResult>(
  request: Promise<TResult>,
): Promise<TMaybeUndefined<TResult>> =>
  request.catch((error: unknown) => {
    if (!unstable_isUnrecognizedActionError(error)) throw error;
    listeners.forEach((notify) => notify());
    return undefined;
  });
