import 'server-only';

import { oauthEnv } from '@shinefold/auth/utils/oauth-env/oauth-env';
import type { TMaybeUndefined, TOAuthCredentials } from '@shinefold/config';
import {
  OAUTH_PROVIDER,
  type TOAuthProvider,
} from '@shinefold/config/constants';
import type { TTenantOAuthCredentialsByProvider } from '@shinefold/db/queries/tenant-oauth-credentials/get-tenant-oauth-credentials/get-tenant-oauth-credentials';
import { isUndefined } from '@shinefold/utils/primitives';

export type TOAuthProviderId = TOAuthProvider;

export const OAUTH_PROVIDER_IDS = [
  OAUTH_PROVIDER.GITHUB,
  OAUTH_PROVIDER.GOOGLE,
] as const satisfies readonly TOAuthProviderId[];

const OAUTH_CREDENTIAL_GETTERS: Record<
  TOAuthProviderId,
  () => TMaybeUndefined<TOAuthCredentials>
> = {
  [OAUTH_PROVIDER.GITHUB]: () =>
    oauthEnv.AUTH_GITHUB_ID && oauthEnv.AUTH_GITHUB_SECRET
      ? {
          clientId: oauthEnv.AUTH_GITHUB_ID,
          clientSecret: oauthEnv.AUTH_GITHUB_SECRET,
        }
      : undefined,
  [OAUTH_PROVIDER.GOOGLE]: () =>
    oauthEnv.AUTH_GOOGLE_ID && oauthEnv.AUTH_GOOGLE_SECRET
      ? {
          clientId: oauthEnv.AUTH_GOOGLE_ID,
          clientSecret: oauthEnv.AUTH_GOOGLE_SECRET,
        }
      : undefined,
};

/**
 * The single predicate both `config.ts`'s provider gating and
 * `getEnabledOAuthProviderIds` resolve through, so the registered and
 * advertised provider sets can never drift apart.
 */
export function getOAuthProviderCredentials(
  id: TOAuthProviderId,
  siteCredentials: TTenantOAuthCredentialsByProvider = {},
): TMaybeUndefined<TOAuthCredentials> {
  return siteCredentials[id] ?? OAUTH_CREDENTIAL_GETTERS[id]();
}

export function getEnabledOAuthProviderIds(
  siteCredentials: TTenantOAuthCredentialsByProvider = {},
): TOAuthProviderId[] {
  return OAUTH_PROVIDER_IDS.filter(
    (id) => !isUndefined(getOAuthProviderCredentials(id, siteCredentials)),
  );
}
