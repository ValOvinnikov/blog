import {
  SUBSCRIBERS_CSV_HEADER,
  SUBSCRIBERS_EXPORT_FILE_PREFIX,
} from '@platform/constants/subscribers';
import type { TExportedSubscriber } from '@shinefold/db/queries/subscribers/list-subscribers-for-export/list-subscribers-for-export';
import { toCsv } from '@shinefold/utils/csv';
import { utcDay } from '@shinefold/utils/date';

export const toSubscribersCsv = (
  subscribers: readonly TExportedSubscriber[],
): string =>
  toCsv([
    SUBSCRIBERS_CSV_HEADER,
    ...subscribers.map(({ email, confirmedAt }) => [
      email,
      confirmedAt.toISOString(),
    ]),
  ]);

export const toSubscribersFileName = (
  siteAddress: string,
  at: Date,
): string => {
  const [siteSlug] = siteAddress.split('.');
  return `${SUBSCRIBERS_EXPORT_FILE_PREFIX}-${siteSlug}-${utcDay(at)}.csv`;
};
