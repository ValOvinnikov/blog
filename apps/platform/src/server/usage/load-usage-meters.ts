import 'server-only';

import {
  USAGE_LOG,
  USAGE_METER,
  type TUsageMeter,
} from '@platform/constants/usage';
import type { TGrantProvenance } from '@platform/utils/granted-entitlements/granted-entitlements';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TUsageReading } from '@platform/utils/usage-summary/usage-summary';
import { CAPABILITY, type TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';

import {
  countedMeter,
  readEmailsMeter,
  readLanguagesMeter,
  type TUsageMeterRead,
} from './usage-meter-read';

export type TUsageMeterRow = {
  meter: TUsageMeter;
  reading: TMaybeUndefined<TUsageReading>;
  pausedPostNeeds: TMaybeUndefined<number>;
  isMonthly: boolean;
  href: TMaybeUndefined<string>;
  grant: TMaybeUndefined<TGrantProvenance>;
};

export type TUsageLinks = {
  languages: string;
  team?: string;
  subscribers?: string;
};

type TUsageMeterSource = Omit<TUsageMeterRow, 'reading' | 'pausedPostNeeds'> & {
  read: () => Promise<TUsageMeterRead>;
};

const readMeter = async (
  tenantId: string,
  { read, ...row }: TUsageMeterSource,
): Promise<TUsageMeterRow> => {
  try {
    return { ...row, ...(await read()) };
  } catch (error) {
    logger.error(USAGE_LOG.METER_READ_FAILED, {
      tenantId,
      meter: row.meter,
      ...toLoggableError(error),
    });
    return { ...row, reading: undefined, pausedPostNeeds: undefined };
  }
};

const meterSources = (
  tenant: TPlatformTenant,
  links: TUsageLinks,
): TUsageMeterSource[] => {
  const { id, entitlements, grantedEntitlements } = tenant;
  const { takeawaysPerMonth, seats, capabilities, localeLimit } = entitlements;

  return [
    {
      meter: USAGE_METER.TAKEAWAYS,
      isMonthly: true,
      href: undefined,
      grant: undefined,
      read: () =>
        countedMeter(
          queries.takeawayGenerations.countTakeawayGenerationsThisMonth(id),
          takeawaysPerMonth,
        ),
    },
    ...(capabilities.includes(CAPABILITY.NEWSLETTER)
      ? [
          {
            meter: USAGE_METER.EMAILS,
            isMonthly: true,
            href: links.subscribers,
            grant: grantedEntitlements.capabilities[CAPABILITY.NEWSLETTER],
            read: () => readEmailsMeter(tenant),
          },
        ]
      : []),
    ...(seats > 1
      ? [
          {
            meter: USAGE_METER.SEATS,
            isMonthly: false,
            href: links.team,
            grant: undefined,
            read: () =>
              countedMeter(
                queries.membershipInvites.countSeatsInUse(id),
                seats,
              ),
          },
        ]
      : []),
    ...(localeLimit > 1
      ? [
          {
            meter: USAGE_METER.LANGUAGES,
            isMonthly: false,
            href: links.languages,
            grant: grantedEntitlements.localeLimit,
            read: () => readLanguagesMeter(tenant),
          },
        ]
      : []),
  ];
};

export const loadUsageMeters = (
  tenant: TPlatformTenant,
  links: TUsageLinks,
): Promise<TUsageMeterRow[]> =>
  Promise.all(
    meterSources(tenant, links).map((source) => readMeter(tenant.id, source)),
  );
