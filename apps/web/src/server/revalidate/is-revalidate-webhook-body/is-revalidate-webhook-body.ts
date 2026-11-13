import { isNull, isString, isUndefined } from '@blog/utils/primitives';

export interface IRevalidateWebhookBody {
  _type: string;
  _id: string;
  slug?: string;
}

const isOptionalString = (value: unknown): boolean =>
  isUndefined(value) || isString(value);

export const isRevalidateWebhookBody = (
  value: unknown,
): value is IRevalidateWebhookBody => {
  return (
    typeof value === 'object' &&
    !isNull(value) &&
    isString((value as Record<string, unknown>)['_type']) &&
    isString((value as Record<string, unknown>)['_id']) &&
    isOptionalString((value as Record<string, unknown>)['slug'])
  );
};
