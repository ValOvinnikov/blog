import { createHmac } from 'node:crypto';

import { env } from '@platform/utils/env/env';
import type { TMaybeUndefined } from '@shinefold/config';
import { isSecretMatch } from '@shinefold/utils';

const OWNER_INVITE_TOKEN_MESSAGE_PREFIX = 'owner-invite:';

/** Binds the owner-invite confirmation to the one email it was shown for; `email` must already be normalized (trimmed, lowercased). */
export const createOwnerInviteToken = (email: string): string =>
  createHmac('sha256', env.AUTH_SECRET)
    .update(`${OWNER_INVITE_TOKEN_MESSAGE_PREFIX}${email}`)
    .digest('hex');

export const verifyOwnerInviteToken = (
  email: string,
  token: TMaybeUndefined<string>,
): boolean => {
  if (!token) return false;
  return isSecretMatch(token, createOwnerInviteToken(email));
};
