import 'server-only';

import { oauthEnv } from '@blog/auth/utils/oauth-env/oauth-env';
import type { TMaybeUndefined, TOAuthCredentials } from '@blog/config';
import { OAUTH_PROVIDER, type TOAuthProvider } from '@blog/config/constants';
import { isUndefined } from '@blog/utils/primitives';

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
): TMaybeUndefined<TOAuthCredentials> {
  return OAUTH_CREDENTIAL_GETTERS[id]();
}

export function getEnabledOAuthProviderIds(): TOAuthProviderId[] {
  return OAUTH_PROVIDER_IDS.filter(
    (id) => !isUndefined(getOAuthProviderCredentials(id)),
  );
}
