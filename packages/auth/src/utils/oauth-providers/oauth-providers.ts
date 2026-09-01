import 'server-only';

import { env } from '@blog/auth/utils/env/env';

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
    env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET
      ? { clientId: env.AUTH_GITHUB_ID, clientSecret: env.AUTH_GITHUB_SECRET }
      : undefined,
  google: () =>
    env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? { clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET }
      : undefined,
};

/**
 * getOAuthProviderCredentials — the single source of truth for whether an
 * OAuth provider's full credential pair is present; `config.ts`'s provider
 * gating and `getEnabledOAuthProviderIds` both resolve through this so the
 * registered set and the advertised set can never drift apart.
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
