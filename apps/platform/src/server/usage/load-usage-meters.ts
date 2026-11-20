import 'server-only';

import {
  USAGE_LOG,
  USAGE_METER,
  type TUsageMeter,
} from '@platform/constants/usage';
import type { TGrantProvenance } from '@platform/utils/granted-entitlements/granted-entitlements';
import { toAdditionalLanguages } from '@platform/utils/locale-limit/locale-limit';
import { logger } from '@platform/utils/logger/logger';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TUsageReading } from '@platform/utils/usage-summary/usage-summary';
import { CAPABILITY, type TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';

export type TUsageMeterRow = {
  meter: TUsageMeter;
  reading: TMaybeUndefined<TUsageReading>;
  isMonthly: boolean;
  href: TMaybeUndefined<string>;
  grant: TMaybeUndefined<TGrantProvenance>;
};

type TUsageMeterSource = Omit<TUsageMeterRow, 'reading'> & {
  read: () => Promise<TUsageReading>;
};

const readMeter = async (
  tenantId: string,
  { read, ...row }: TUsageMeterSource,
): Promise<TUsageMeterRow> => {
  try {
    return { ...row, reading: await read() };
  } catch (error) {
    logger.error(USAGE_LOG.METER_READ_FAILED, {
      tenantId,
      meter: row.meter,
      error,
    });
    return { ...row, reading: undefined };
  }
};

const meterSources = (
  tenant: TPlatformTenant,
  languagesHref: string,
): TUsageMeterSource[] => {
  const { id, entitlements, grantedEntitlements } = tenant;
  const { takeawaysPerMonth, seats, capabilities, localeLimit } = entitlements;

  return [
    {
      meter: USAGE_METER.TAKEAWAYS,
      isMonthly: true,
      href: undefined,
      grant: undefined,
      read: async () => ({
        used: await queries.takeawayGenerations.countTakeawayGenerationsThisMonth(
          id,
        ),
        allowance: takeawaysPerMonth,
      }),
    },
    ...(capabilities.includes(CAPABILITY.NEWSLETTER)
      ? [
          {
            meter: USAGE_METER.EMAILS,
            isMonthly: true,
            href: undefined,
            grant: grantedEntitlements.capabilities[CAPABILITY.NEWSLETTER],
            read: async () => {
              const { sentThisMonth, allowance } =
                await queries.emailUsage.getNewsletterLimits(tenant);

              return { used: sentThisMonth, allowance };
            },
          },
        ]
      : []),
    ...(seats > 1
      ? [
          {
            meter: USAGE_METER.SEATS,
            isMonthly: false,
            href: undefined,
            grant: undefined,
            read: async () => ({
              used: await queries.membershipInvites.countSeatsInUse(id),
              allowance: seats,
            }),
          },
        ]
      : []),
    ...(localeLimit > 1
      ? [
          {
            meter: USAGE_METER.LANGUAGES,
            isMonthly: false,
            href: languagesHref,
            grant: grantedEntitlements.localeLimit,
            read: async () => {
              const [, ...liveAdditionalLocales] =
                queries.tenants.selectLiveLocalesWithin(tenant, entitlements);

              return {
                used: liveAdditionalLocales.length,
                allowance: toAdditionalLanguages(localeLimit),
              };
            },
          },
        ]
      : []),
  ];
};

export const loadUsageMeters = (
  tenant: TPlatformTenant,
  languagesHref: string,
): Promise<TUsageMeterRow[]> =>
  Promise.all(
    meterSources(tenant, languagesHref).map((source) =>
      readMeter(tenant.id, source),
    ),
  );
