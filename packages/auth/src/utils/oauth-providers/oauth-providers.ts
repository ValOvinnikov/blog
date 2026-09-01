import 'server-only';

import { oauthEnv } from '@blog/auth/utils/oauth-env/oauth-env';

export type TOAuthProviderId = 'github' | 'google';

type TOAuthCredentials = {
  clientId: string;
  clientSecret: string;
};

const OAUTH_PROVIDER_IDS: readonly TOAuthProviderId[] = ['github', 'google'];

const OAUTH_CREDENTIAL_GETTERS: Record<
  TOAuthProviderId,
  () => TOAuthCredentials | undefined
> = {
  github: () =>
    oauthEnv.AUTH_GITHUB_ID && oauthEnv.AUTH_GITHUB_SECRET
      ? {
          clientId: oauthEnv.AUTH_GITHUB_ID,
          clientSecret: oauthEnv.AUTH_GITHUB_SECRET,
        }
      : undefined,
  google: () =>
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
): TOAuthCredentials | undefined {
  return OAUTH_CREDENTIAL_GETTERS[id]();
}

export function getEnabledOAuthProviderIds(): TOAuthProviderId[] {
  return OAUTH_PROVIDER_IDS.filter(
    (id) => getOAuthProviderCredentials(id) !== undefined,
  );
}
