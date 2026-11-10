import { isNull, isString } from '@blog/utils/primitives';

export interface IRevalidateWebhookBody {
  _type: string;
  _id: string;
  slug?: string;
}

export const isRevalidateWebhookBody = (
  value: unknown,
): value is IRevalidateWebhookBody => {
  return (
    typeof value === 'object' &&
    !isNull(value) &&
    isString((value as Record<string, unknown>)['_type']) &&
    isString((value as Record<string, unknown>)['_id'])
  );
};
