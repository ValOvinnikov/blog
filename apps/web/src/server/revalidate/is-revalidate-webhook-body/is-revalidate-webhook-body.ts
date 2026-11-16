import type { TNullable } from '@shinefold/config';
import { isNull, isString, isUndefined } from '@shinefold/utils/primitives';

export interface IRevalidateWebhookBody {
  _type: string;
  _id: string;
  slug?: TNullable<string>;
  previousSlug?: TNullable<string>;
}

const isNullableString = (value: unknown): boolean =>
  isUndefined(value) || isNull(value) || isString(value);

export const isRevalidateWebhookBody = (
  value: unknown,
): value is IRevalidateWebhookBody => {
  if (typeof value !== 'object' || isNull(value)) {
    return false;
  }
  const { _type, _id, slug, previousSlug } = value as Record<string, unknown>;
  return (
    isString(_type) &&
    isString(_id) &&
    isNullableString(slug) &&
    isNullableString(previousSlug)
  );
};
