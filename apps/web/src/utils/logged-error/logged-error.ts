import { isNull } from '@blog/utils/primitives';

// A realm-wide symbol, because onRequestError can load in a different bundle layer from the render, where a class or WeakSet would not match.
const LOGGED = Symbol.for('@web/logged-error');

export const markErrorLogged = (error: unknown): Error => {
  const marked =
    error instanceof Error ? error : new Error(String(error), { cause: error });
  Object.defineProperty(marked, LOGGED, { value: true });

  return marked;
};

export const isErrorLogged = (error: unknown): boolean =>
  typeof error === 'object' && !isNull(error) && LOGGED in error;
