import type { TOAuthProvider } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { tenantOAuthCredentials } from '@shinefold/db/schema/tenant-oauth-credentials';
import { hasLength } from '@shinefold/utils/primitives';
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
