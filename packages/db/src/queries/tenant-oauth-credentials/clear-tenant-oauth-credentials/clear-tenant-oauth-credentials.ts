import type { TOAuthProvider } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenantOAuthCredentials } from '@blog/db/schema/tenant-oauth-credentials';
import { hasLength } from '@blog/utils/primitives';
import { and, eq } from 'drizzle-orm';

export async function clearTenantOAuthCredentials(
  tenantId: string,
  provider: TOAuthProvider,
): Promise<boolean> {
  const rows = await getDb()
    .delete(tenantOAuthCredentials)
    .where(
      and(
        eq(tenantOAuthCredentials.tenantId, tenantId),
        eq(tenantOAuthCredentials.provider, provider),
      ),
    )
    .returning({ provider: tenantOAuthCredentials.provider });

  return hasLength(rows);
}
