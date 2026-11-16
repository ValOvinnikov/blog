import { MAGIC_LINK_REFUSAL } from '@shinefold/config/constants';
import type {
  IMagicLinkSendRefusal,
  TMaybeUndefined,
} from '@shinefold/config/types';
import { queries } from '@shinefold/db';
import { resolveClientKey } from '@shinefold/utils/client-key';
import { sha256Hex } from '@shinefold/utils/hash';
import { normalizeEmailIdentity } from '@shinefold/utils/normalize-email-identity';
import { isString } from '@shinefold/utils/primitives';

const SEND_LIMIT_WINDOW_MS = 60 * 60_000;
const MAX_SENDS_PER_EMAIL = 10;
// Higher than the per-email cap so a shared office or carrier NAT can still sign several people in.
const MAX_SENDS_PER_IP = 20;

const toCounterKey = (scope: string, value: string): string =>
  `${scope}:${sha256Hex(value)}`;

// A query error's message, cause.message and detail can embed a counter key or the address, so only the name and Postgres code leave.
function toCheckFailure(error: unknown): IMagicLinkSendRefusal {
  const refusal = { reason: MAGIC_LINK_REFUSAL.CHECK_FAILED };
  if (!(error instanceof Error)) return refusal;

  const { cause } = error;
  const code =
    cause instanceof Object && 'code' in cause && isString(cause.code)
      ? cause.code
      : undefined;

  return { ...refusal, errorName: error.name, errorCode: code };
}

/** A failed check resolves a `CHECK_FAILED` refusal rather than throwing. */
export async function findMagicLinkSendRefusal(
  identifier: string,
  request: Request,
): Promise<TMaybeUndefined<IMagicLinkSendRefusal>> {
  try {
    const blocked =
      await queries.blockedSignupIdentities.isSignupBlocked(identifier);
    if (!blocked.ok) {
      return {
        reason: MAGIC_LINK_REFUSAL.CHECK_FAILED,
        errorCode: blocked.error,
      };
    }
    if (blocked.data) return { reason: MAGIC_LINK_REFUSAL.BLOCKED };

    return await findSendLimitRefusal(identifier, request);
  } catch (error) {
    return toCheckFailure(error);
  }
}

async function findSendLimitRefusal(
  identifier: string,
  request: Request,
): Promise<TMaybeUndefined<IMagicLinkSendRefusal>> {
  const ipSends =
    await queries.magicLinkSendCounters.incrementMagicLinkSendCount(
      toCounterKey('magic-link-ip', resolveClientKey(request.headers)),
      SEND_LIMIT_WINDOW_MS,
    );
  // An IP over its limit must not spend the address's sends, or it could lock the owner out.
  if (ipSends > MAX_SENDS_PER_IP) {
    return { reason: MAGIC_LINK_REFUSAL.NETWORK_LIMIT };
  }

  const emailSends =
    await queries.magicLinkSendCounters.incrementMagicLinkSendCount(
      toCounterKey('magic-link-email', normalizeEmailIdentity(identifier)),
      SEND_LIMIT_WINDOW_MS,
    );
  if (emailSends > MAX_SENDS_PER_EMAIL) {
    return { reason: MAGIC_LINK_REFUSAL.ADDRESS_LIMIT };
  }

  return undefined;
}
