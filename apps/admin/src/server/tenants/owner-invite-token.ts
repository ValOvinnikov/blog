import { createHmac } from 'node:crypto';

import { env } from '@admin/utils/env/env';
import { isSecretMatch } from '@admin/utils/is-secret-match/is-secret-match';

const OWNER_INVITE_TOKEN_MESSAGE_PREFIX = 'owner-invite:';

/**
 * Ties the owner-invite soft-confirmation to one specific email, server-side
 * — an operator can only skip the "no account found" prompt for an email
 * they were actually shown it for, not any email paired with a bare flag.
 * `email` must already be normalized (trimmed, lowercased); the caller
 * (the zod schema in `create-tenant-action.ts`) already guarantees this.
 */
export const createOwnerInviteToken = (email: string): string =>
  createHmac('sha256', env.AUTH_SECRET)
    .update(`${OWNER_INVITE_TOKEN_MESSAGE_PREFIX}${email}`)
    .digest('hex');

export const verifyOwnerInviteToken = (
  email: string,
  token: string | undefined,
): boolean => {
  if (!token) return false;
  return isSecretMatch(token, createOwnerInviteToken(email));
};
