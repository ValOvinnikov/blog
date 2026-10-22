import { queries } from '@blog/db';
import { resolveClientKey } from '@blog/utils/client-key';
import { sha256Hex } from '@blog/utils/hash';
import { normalizeEmailIdentity } from '@blog/utils/normalize-email-identity';

const SEND_LIMIT_WINDOW_MS = 60 * 60_000;
const MAX_SENDS_PER_EMAIL = 10;
// Higher than the per-email cap so a shared office or carrier NAT can still sign several people in.
const MAX_SENDS_PER_IP = 20;

const toCounterKey = (scope: string, value: string): string =>
  `${scope}:${sha256Hex(value)}`;

/** Every reason not to send resolves `false` rather than throwing, so a refusal and a failed check look alike. */
export async function isMagicLinkSendAllowed(
  identifier: string,
  request: Request,
): Promise<boolean> {
  try {
    const blocked =
      await queries.blockedSignupIdentities.isSignupBlocked(identifier);
    if (!blocked.ok || blocked.data) return false;

    return await isWithinSendLimits(identifier, request);
  } catch {
    return false;
  }
}

async function isWithinSendLimits(
  identifier: string,
  request: Request,
): Promise<boolean> {
  const ipSends =
    await queries.magicLinkSendCounters.incrementMagicLinkSendCount(
      toCounterKey('magic-link-ip', resolveClientKey(request.headers)),
      SEND_LIMIT_WINDOW_MS,
    );
  // An IP over its limit must not spend the address's sends, or it could lock the owner out.
  if (ipSends > MAX_SENDS_PER_IP) return false;

  const emailSends =
    await queries.magicLinkSendCounters.incrementMagicLinkSendCount(
      toCounterKey('magic-link-email', normalizeEmailIdentity(identifier)),
      SEND_LIMIT_WINDOW_MS,
    );

  return emailSends <= MAX_SENDS_PER_EMAIL;
}
