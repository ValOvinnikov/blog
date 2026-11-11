import { ANALYTICS_PROVIDER } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenantAnalytics } from '@blog/db/schema/tenant-analytics';
import { z } from 'zod';

export const saveTenantAnalyticsInputSchema = z.object({
  provider: z.enum(ANALYTICS_PROVIDER),
  analyticsId: z.string().trim().min(1),
});

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
