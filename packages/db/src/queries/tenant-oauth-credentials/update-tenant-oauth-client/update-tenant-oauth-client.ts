import { OAUTH_PROVIDER } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { tenantOAuthCredentials } from '@blog/db/schema/tenant-oauth-credentials';
import { hasLength } from '@blog/utils/primitives';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

export const updateTenantOAuthClientInputSchema = z.object({
  provider: z.enum(OAUTH_PROVIDER),
  clientId: z.string().trim().min(1),
  callbackDomain: z.string().trim().min(1),
});

export type TUpdateTenantOAuthClientInput = z.input<
  typeof updateTenantOAuthClientInputSchema
>;

// Keeps the stored secret; resolves false when the provider has no saved app.
export async function updateTenantOAuthClient(
  tenantId: string,
  input: TUpdateTenantOAuthClientInput,
): Promise<boolean> {
  const { provider, clientId, callbackDomain } =
    updateTenantOAuthClientInputSchema.parse(input);

  const rows = await getDb()
    .update(tenantOAuthCredentials)
    .set({ clientId, callbackDomain })
    .where(
      and(
        eq(tenantOAuthCredentials.tenantId, tenantId),
        eq(tenantOAuthCredentials.provider, provider),
      ),
    )
    .returning({ provider: tenantOAuthCredentials.provider });

  return hasLength(rows);
}
