import type { TMaybeUndefined } from '@shinefold/config';
import { isString } from '@shinefold/utils/primitives';

type TLoggableError = {
  errorName: string;
  errorCode: TMaybeUndefined<string>;
};

// A message, cause.message or detail can embed a query's bound parameters or a provider's text, an address or its hash among them.
export const toLoggableError = (error: unknown): TLoggableError => {
  if (!(error instanceof Error)) {
    return { errorName: typeof error, errorCode: undefined };
  }

  const { name, cause } = error;
  const errorCode =
    cause instanceof Object && 'code' in cause && isString(cause.code)
      ? cause.code
      : undefined;

  return { errorName: name, errorCode };
};
