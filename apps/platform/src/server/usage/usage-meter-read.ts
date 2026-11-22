import 'server-only';

import { toAdditionalLanguages } from '@platform/utils/locale-limit/locale-limit';
import { isOutOfMonthlyEmails } from '@platform/utils/newsletter-pause-state/newsletter-pause-state';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TUsageReading } from '@platform/utils/usage-summary/usage-summary';
import type { TMaybeUndefined } from '@shinefold/config';
import { queries } from '@shinefold/db';

export type TUsageMeterRead = {
  reading: TUsageReading;
  pausedPostNeeds: TMaybeUndefined<number>;
};

export const countedMeter = async (
  count: number | Promise<number>,
  allowance: number,
): Promise<TUsageMeterRead> => ({
  reading: { used: await count, allowance },
  pausedPostNeeds: undefined,
});

export const readEmailsMeter = async (
  tenant: TPlatformTenant,
): Promise<TUsageMeterRead> => {
  const limits = await queries.emailUsage.getNewsletterLimits(tenant);
  const { sentThisMonth, allowance, activeCount } = limits;

  return {
    reading: { used: sentThisMonth, allowance },
    pausedPostNeeds: isOutOfMonthlyEmails(limits) ? activeCount : undefined,
  };
};

export const readLanguagesMeter = (
  tenant: TPlatformTenant,
): Promise<TUsageMeterRead> => {
  const { entitlements } = tenant;
  const [, ...liveAdditionalLocales] = queries.tenants.selectLiveLocalesWithin(
    tenant,
    entitlements,
  );

  return countedMeter(
    liveAdditionalLocales.length,
    toAdditionalLanguages(entitlements.localeLimit),
  );
};
