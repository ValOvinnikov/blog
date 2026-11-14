import type { TMaybeUndefined } from '@blog/config/types';
import {
  RETRY_AFTER_HEADER,
  RETRY_AFTER_SECOND_MS,
} from '@worker/constants/retry-after';

export function readRetryAfter(response: Response): TMaybeUndefined<Date> {
  const value = response.headers.get(RETRY_AFTER_HEADER)?.trim();
  if (!value) return undefined;

  const date = /^\d+$/.test(value)
    ? new Date(Date.now() + Number(value) * RETRY_AFTER_SECOND_MS)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
