import {
  SANITY_LOGIN_PROVIDER,
  type TSanityLoginProvider,
} from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import type { AuthProvider } from 'sanity';

import { buildLoginProviderAuth } from './login-provider-auth';

faker.seed(6017);

const PROVIDER_NAME = {
  GOOGLE: 'google',
  GITHUB: 'github',
  SANITY: 'sanity',
} as const;

const mockProvider = (name: string): AuthProvider => ({
  name,
  title: faker.company.name(),
  url: faker.internet.url(),
});

const MOCK_DEFAULT_PROVIDERS = Object.values(PROVIDER_NAME).map(mockProvider);

const resolveProviders = async (
  loginProvider: TSanityLoginProvider,
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
    const { redirectOnSingle } = buildLoginProviderAuth(
      SANITY_LOGIN_PROVIDER.GOOGLE,
    );

    expect(redirectOnSingle).toBe(true);
  });

  it.each([
    [SANITY_LOGIN_PROVIDER.GOOGLE, PROVIDER_NAME.GOOGLE],
    [SANITY_LOGIN_PROVIDER.GITHUB, PROVIDER_NAME.GITHUB],
    [SANITY_LOGIN_PROVIDER.SANITY, PROVIDER_NAME.SANITY],
  ])('offers only the %s provider', async (loginProvider, name) => {
    const providers = await resolveProviders(
      loginProvider,
      MOCK_DEFAULT_PROVIDERS,
    );

    expect(providers.map((provider) => provider.name)).toEqual([name]);
  });

  it('keeps every default provider when none matches', async () => {
    const defaults = MOCK_DEFAULT_PROVIDERS.filter(
      ({ name }) => name !== PROVIDER_NAME.GITHUB,
    );

    const providers = await resolveProviders(
      SANITY_LOGIN_PROVIDER.GITHUB,
      defaults,
    );

    expect(providers).toEqual(defaults);
  });
});
