import {
  LOCALE_BCP47_TAGS,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import {
  INACTIVITY_STAGE_DAY,
  type TInactivityStage,
} from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { daysAfter } from '@shinefold/db/utils/day-offset/day-offset';

export function inactivityStageDate(
  { lastActivityAt }: TTenant,
  stage: TInactivityStage,
): Date {
  return daysAfter(lastActivityAt, INACTIVITY_STAGE_DAY[stage]);
}

export function formatInactivityDate(
  date: Date,
  locale: TLocaleIsoCode,
): string {
  return new Intl.DateTimeFormat(LOCALE_BCP47_TAGS[locale], {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date);
}
