import 'server-only';

import { OAUTH_PROVIDERS } from '@platform/constants/sign-in-apps';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TOAuthProvider } from '@shinefold/config/constants';

import { readSavedSignInApps } from './read-saved-sign-in-apps';

export const listOwnSignInAppProviders = async ({
  id,
  entitlements,
}: Pick<TPlatformTenant, 'id' | 'entitlements'>): Promise<TOAuthProvider[]> => {
  if (!entitlements.hasOwnOAuthApps) return [];

  const savedApps = await readSavedSignInApps(id);
  return OAUTH_PROVIDERS.filter((provider) => savedApps.has(provider));
};
