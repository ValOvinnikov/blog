import { queries } from '@blog/db';
import { resolveClientKey } from '@blog/utils/client-key';
import { hashSha256Hex } from '@blog/utils/hash';

const SEND_LIMIT_WINDOW_MS = 60 * 60_000;
const MAX_SENDS_PER_EMAIL = 5;
// Higher than the per-email cap so a shared office or carrier NAT can still sign several people in.
const MAX_SENDS_PER_IP = 20;

const toCounterKey = (scope: string, value: string): string =>
  `${scope}:${hashSha256Hex(value)}`;

export async function isMagicLinkSendAllowed(
  identifier: string,
  request: Request,
): Promise<boolean> {
  const [emailSends, ipSends] = await Promise.all([
    queries.magicLinkSendCounters.incrementMagicLinkSendCount(
      toCounterKey('magic-link-email', identifier.toLowerCase()),
      SEND_LIMIT_WINDOW_MS,
    ),
    queries.magicLinkSendCounters.incrementMagicLinkSendCount(
      toCounterKey('magic-link-ip', resolveClientKey(request.headers)),
      SEND_LIMIT_WINDOW_MS,
    ),
  ]);

  return emailSends <= MAX_SENDS_PER_EMAIL && ipSends <= MAX_SENDS_PER_IP;
}
