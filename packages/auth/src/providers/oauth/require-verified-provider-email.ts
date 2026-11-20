import 'server-only';

import { OAuthAccountNotLinked } from '@auth/core/errors';
import { OAUTH_PROVIDER_IDS } from '@shinefold/auth/utils/oauth-providers/oauth-providers';
import type { TMaybeUndefined, TNullable } from '@shinefold/config/types';
import type { Account, Profile } from 'next-auth';

const OAUTH_PROVIDER_ID_SET: ReadonlySet<string> = new Set(OAUTH_PROVIDER_IDS);

export function requireVerifiedProviderEmail(
  account: TNullable<Account>,
  profile: TMaybeUndefined<Profile>,
): true {
  if (
    !account ||
    !OAUTH_PROVIDER_ID_SET.has(account.provider) ||
    profile?.email_verified === true
  ) {
    return true;
  }

  throw new OAuthAccountNotLinked(
    'The provider has not verified this email address',
  );
}
