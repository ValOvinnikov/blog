import {
  ANALYTICS_PROVIDER,
  DOMAIN_PATTERN,
  GOOGLE_ANALYTICS_ID_PATTERN,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenantAnalytics } from '@blog/db/schema/tenant-analytics';
import { z } from 'zod';

export const saveTenantAnalyticsInputSchema = z.discriminatedUnion('provider', [
  z.object({
    provider: z.literal(ANALYTICS_PROVIDER.GOOGLE_ANALYTICS),
    analyticsId: z.string().trim().regex(GOOGLE_ANALYTICS_ID_PATTERN),
  }),
  z.object({
    provider: z.literal(ANALYTICS_PROVIDER.PLAUSIBLE),
    analyticsId: z.string().trim().toLowerCase().regex(DOMAIN_PATTERN),
  }),
]);

export type TTenantAnalytics = z.output<typeof saveTenantAnalyticsInputSchema>;

export async function saveTenantAnalytics(
  tenantId: string,
  input: z.input<typeof saveTenantAnalyticsInputSchema>,
): Promise<void> {
  const { provider, analyticsId } = saveTenantAnalyticsInputSchema.parse(input);

  await getDb()
    .insert(tenantAnalytics)
    .values({ tenantId, provider, analyticsId })
    .onConflictDoUpdate({
      target: tenantAnalytics.tenantId,
      set: { provider, analyticsId },
    });
}
