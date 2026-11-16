import type { TOAuthProvider } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { tenantOAuthCredentials } from '@shinefold/db/schema/tenant-oauth-credentials';
import { and, eq } from 'drizzle-orm';

export async function confirmTenantOAuthCallbackDomain(
  tenantId: string,
  provider: TOAuthProvider,
  callbackDomain: string,
): Promise<void> {
  await getDb()
    .update(tenantOAuthCredentials)
    .set({ callbackDomain })
    .where(
      and(
        eq(tenantOAuthCredentials.tenantId, tenantId),
        eq(tenantOAuthCredentials.provider, provider),
      ),
    );
}
