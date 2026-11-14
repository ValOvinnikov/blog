import type { TNullable } from '@blog/config';
import { isNull, isString, isUndefined } from '@blog/utils/primitives';

export interface IRevalidateWebhookBody {
  _type: string;
  _id: string;
  slug?: TNullable<string>;
}

const isNullableString = (value: unknown): boolean =>
  isUndefined(value) || isNull(value) || isString(value);

export const isRevalidateWebhookBody = (
  value: unknown,
): value is IRevalidateWebhookBody => {
  return (
    typeof value === 'object' &&
    !isNull(value) &&
    isString((value as Record<string, unknown>)['_type']) &&
    isString((value as Record<string, unknown>)['_id']) &&
    isNullableString((value as Record<string, unknown>)['slug'])
  );
};
