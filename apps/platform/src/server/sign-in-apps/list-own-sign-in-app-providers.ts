import 'server-only';

import type { TOAuthProvider, TTenantPlan } from '@blog/config/constants';
import { queries } from '@blog/db';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { OAUTH_PROVIDERS } from '@platform/constants/sign-in-apps';

export const listOwnSignInAppProviders = async (
  tenantId: string,
  plan: TTenantPlan,
): Promise<TOAuthProvider[]> => {
  if (!PLAN_ENTITLEMENTS[plan].hasOwnOAuthApps) return [];

  const clients =
    await queries.tenantOAuthCredentials.listTenantOAuthClients(tenantId);
  const saved = new Set(clients.map(({ provider }) => provider));
  return OAUTH_PROVIDERS.filter((provider) => saved.has(provider));
};
