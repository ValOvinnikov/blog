import 'server-only';

import type { TOAuthProvider } from '@blog/config/constants';
import { queries } from '@blog/db';
import { OAUTH_PROVIDERS } from '@platform/constants/sign-in-apps';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const listOwnSignInAppProviders = async ({
  id,
  entitlements,
}: Pick<TPlatformTenant, 'id' | 'entitlements'>): Promise<TOAuthProvider[]> => {
  if (!entitlements.hasOwnOAuthApps) return [];

  const clients =
    await queries.tenantOAuthCredentials.listTenantOAuthClients(id);
  const saved = new Set(clients.map(({ provider }) => provider));
  return OAUTH_PROVIDERS.filter((provider) => saved.has(provider));
};
