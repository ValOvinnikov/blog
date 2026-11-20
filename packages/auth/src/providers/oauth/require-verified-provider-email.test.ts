import { OAuthAccountNotLinked } from '@auth/core/errors';
import { MAGIC_LINK_PROVIDER_ID } from '@shinefold/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import {
  MOCK_EMAIL,
  MOCK_PROVIDER_ACCOUNT_ID,
} from '@shinefold/auth/testing/session-fixtures';
import { OAUTH_PROVIDER } from '@shinefold/config/constants';
import type { Account } from 'next-auth';

import { requireVerifiedProviderEmail } from './require-verified-provider-email';

function accountFor(provider: string): Account {
  return {
    provider,
    providerAccountId: MOCK_PROVIDER_ACCOUNT_ID,
    type: provider === MAGIC_LINK_PROVIDER_ID ? 'email' : 'oauth',
  };
}

describe(requireVerifiedProviderEmail, () => {
  it.each([OAUTH_PROVIDER.GITHUB, OAUTH_PROVIDER.GOOGLE])(
    'allows a %s sign-in whose email the provider has verified',
    (provider) => {
      expect(
        requireVerifiedProviderEmail(accountFor(provider), {
          email: MOCK_EMAIL,
          email_verified: true,
        }),
      ).toBe(true);
    },
  );

  it.each([OAUTH_PROVIDER.GITHUB, OAUTH_PROVIDER.GOOGLE])(
    'refuses a %s sign-in whose email the provider has not verified',
    (provider) => {
      expect(() =>
        requireVerifiedProviderEmail(accountFor(provider), {
          email: MOCK_EMAIL,
          email_verified: false,
        }),
      ).toThrow(OAuthAccountNotLinked);
    },
  );

  it('refuses a provider sign-in that says nothing about verification', () => {
    expect(() =>
      requireVerifiedProviderEmail(accountFor(OAUTH_PROVIDER.GOOGLE), {
        email: MOCK_EMAIL,
      }),
    ).toThrow(OAuthAccountNotLinked);
  });

  it('allows a magic-link sign-in, which has no provider profile', () => {
    expect(
      requireVerifiedProviderEmail(
        accountFor(MAGIC_LINK_PROVIDER_ID),
        undefined,
      ),
    ).toBe(true);
  });
});
