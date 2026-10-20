import { SANITY_LOGIN_PROVIDER } from '@blog/config/constants';
import type { AuthProvider } from 'sanity';

import { buildLoginProviderAuth } from './login-provider-auth';

const DEFAULT_PROVIDERS: AuthProvider[] = [
  {
    name: 'google',
    title: 'Google',
    url: 'https://api.sanity.io/v1/auth/login/google',
  },
  {
    name: 'github',
    title: 'GitHub',
    url: 'https://api.sanity.io/v1/auth/login/github',
  },
  {
    name: 'sanity',
    title: 'E-mail / password',
    url: 'https://api.sanity.io/v1/auth/login/sanity',
  },
];

const resolveProviders = async (
  loginProvider: Parameters<typeof buildLoginProviderAuth>[0],
  defaults: AuthProvider[],
) => {
  const { providers } = buildLoginProviderAuth(loginProvider);
  if (typeof providers !== 'function') {
    throw new Error('expected providers to be a function');
  }
  return providers(defaults);
};

describe(buildLoginProviderAuth, () => {
  it('skips the provider choice screen when one provider is left', () => {
    expect(
      buildLoginProviderAuth(SANITY_LOGIN_PROVIDER.GOOGLE).redirectOnSingle,
    ).toBe(true);
  });

  it.each([
    [SANITY_LOGIN_PROVIDER.GOOGLE, 'google'],
    [SANITY_LOGIN_PROVIDER.GITHUB, 'github'],
    [SANITY_LOGIN_PROVIDER.SANITY, 'sanity'],
  ])('offers only the %s provider', async (loginProvider, name) => {
    const providers = await resolveProviders(loginProvider, DEFAULT_PROVIDERS);

    expect(providers.map((provider) => provider.name)).toEqual([name]);
  });

  it('keeps every default provider when none matches', async () => {
    const defaults = DEFAULT_PROVIDERS.filter(({ name }) => name !== 'github');

    const providers = await resolveProviders(
      SANITY_LOGIN_PROVIDER.GITHUB,
      defaults,
    );

    expect(providers).toEqual(defaults);
  });
});
