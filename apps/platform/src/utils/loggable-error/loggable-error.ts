import type { TMaybeUndefined } from '@shinefold/config';
import { isString, isUndefined } from '@shinefold/utils/primitives';

type TLoggableError = {
  errorName: string;
  errorCode: TMaybeUndefined<string>;
  errorType?: string;
  statusCode?: number;
  requestId?: string;
};

const fieldOf = (source: unknown, key: string): unknown =>
  source instanceof Object ? Reflect.get(source, key) : undefined;

const stringField = (source: unknown, key: string): TMaybeUndefined<string> => {
  const value = fieldOf(source, key);
  return isString(value) ? value : undefined;
};

const numberField = (source: unknown, key: string): TMaybeUndefined<number> => {
  const value = fieldOf(source, key);
  return typeof value === 'number' ? value : undefined;
};

// A message, raw, param, cause.message or detail can embed a query's bound parameters or a provider's text, an address or its hash among them.
export const toLoggableError = (error: unknown): TLoggableError => {
  if (!(error instanceof Error)) {
    return { errorName: typeof error, errorCode: undefined };
  }

  const errorType = stringField(error, 'type');
  const statusCode = numberField(error, 'statusCode');
  const requestId = stringField(error, 'requestId');

  return {
    errorName: error.name,
    errorCode: stringField(error, 'code') ?? stringField(error.cause, 'code'),
    ...(errorType && { errorType }),
    ...(!isUndefined(statusCode) && { statusCode }),
    ...(requestId && { requestId }),
  };
};
