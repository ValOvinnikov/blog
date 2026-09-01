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
