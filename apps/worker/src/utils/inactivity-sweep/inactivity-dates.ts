import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config/constants';
import {
  DAY_MS,
  INACTIVITY_STAGE_DAY,
  type TInactivityStage,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

export function inactivityStageDate(
  { lastActivityAt }: TTenant,
  stage: TInactivityStage,
): Date {
  return new Date(
    lastActivityAt.getTime() + INACTIVITY_STAGE_DAY[stage] * DAY_MS,
  );
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
