import {
  SANITY_LOGIN_PROVIDER,
  type TSanityLoginProvider,
} from '@blog/config/constants';
import type { AuthConfig, AuthProvider } from 'sanity';

const SANITY_PROVIDER_NAME: Record<TSanityLoginProvider, string> = {
  [SANITY_LOGIN_PROVIDER.GOOGLE]: 'google',
  [SANITY_LOGIN_PROVIDER.GITHUB]: 'github',
  [SANITY_LOGIN_PROVIDER.SANITY]: 'sanity',
};

export const buildLoginProviderAuth = (
  loginProvider: TSanityLoginProvider,
): AuthConfig => ({
  redirectOnSingle: true,
  providers: (defaults: AuthProvider[]) => {
    const matching = defaults.filter(
      ({ name }) => name === SANITY_PROVIDER_NAME[loginProvider],
    );
    // An unmatched name must not leave the owner with no way to sign in.
    return matching.length > 0 ? matching : defaults;
  },
});
