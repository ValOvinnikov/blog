import type { TOAuthProvider } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenantOAuthCredentials } from '@blog/db/schema/tenant-oauth-credentials';
import { and, eq } from 'drizzle-orm';

export async function clearTenantOAuthCredentials(
  tenantId: string,
  provider: TOAuthProvider,
): Promise<void> {
  await getDb()
    .delete(tenantOAuthCredentials)
    .where(
      and(
        eq(tenantOAuthCredentials.tenantId, tenantId),
        eq(tenantOAuthCredentials.provider, provider),
      ),
    );
}
