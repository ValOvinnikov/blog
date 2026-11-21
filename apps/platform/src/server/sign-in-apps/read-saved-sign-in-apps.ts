import 'server-only';

import type { TOAuthProvider } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import type { TTenantOAuthClient } from '@shinefold/db/queries/tenant-oauth-credentials';

export const readSavedSignInApps = async (
  tenantId: string,
): Promise<Map<TOAuthProvider, TTenantOAuthClient>> => {
  const clients =
    await queries.tenantOAuthCredentials.listTenantOAuthClients(tenantId);
  return new Map(clients.map((client) => [client.provider, client]));
};
