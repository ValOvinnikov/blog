import 'server-only';

import { OAuthAccountNotLinked } from '@auth/core/errors';
import { OAUTH_PROVIDER_IDS } from '@shinefold/auth/utils/oauth-providers/oauth-providers';
import type { TMaybeUndefined, TNullable } from '@shinefold/config/types';
import { isOneOf } from '@shinefold/utils/primitives';
import type { Account, Profile } from 'next-auth';

export function requireVerifiedProviderEmail(
  account: TNullable<Account>,
  profile: TMaybeUndefined<Profile>,
): true {
  if (
    !account ||
    !isOneOf(OAUTH_PROVIDER_IDS, account.provider) ||
    profile?.email_verified === true
  ) {
    return true;
  }

  throw new OAuthAccountNotLinked(
    'The provider has not verified this email address',
  );
}
