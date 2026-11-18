import type { TNullable } from '@shinefold/config';
import { isNull, isString, isUndefined } from '@shinefold/utils/primitives';

export interface IRevalidateWebhookRedirect {
  source?: TNullable<string>;
  previousSource?: TNullable<string>;
  language?: TNullable<string>;
  isPrefix?: TNullable<boolean>;
}

export interface IRevalidateWebhookBody extends IRevalidateWebhookRedirect {
  _type: string;
  _id: string;
  slug?: TNullable<string>;
  previousSlug?: TNullable<string>;
}

const isAbsent = (value: unknown): boolean =>
  isUndefined(value) || isNull(value);

const isNullableString = (value: unknown): boolean =>
  isAbsent(value) || isString(value);

const isNullableBoolean = (value: unknown): boolean =>
  isAbsent(value) || typeof value === 'boolean';

export const isRevalidateWebhookBody = (
  value: unknown,
): value is IRevalidateWebhookBody => {
  if (typeof value !== 'object' || isNull(value)) {
    return false;
  }
  const { _type, _id, slug, previousSlug } = value as Record<string, unknown>;
  const { source, previousSource, language, isPrefix } = value as Record<
    string,
    unknown
  >;
  return (
    isString(_type) &&
    isString(_id) &&
    [slug, previousSlug, source, previousSource, language].every(
      isNullableString,
    ) &&
    isNullableBoolean(isPrefix)
  );
};
