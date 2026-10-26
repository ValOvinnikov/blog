import { findMagicLinkSendRefusal } from '@blog/auth/providers/magic-link/find-magic-link-send-refusal/find-magic-link-send-refusal';
import { MagicLinkSendLimitedError } from '@blog/auth/providers/magic-link/magic-link-send-limited-error/magic-link-send-limited-error';
import { resolveMagicLinkFromAddress } from '@blog/auth/providers/magic-link/resolve-magic-link-from-address/resolve-magic-link-from-address';
import { sendMagicLinkEmail } from '@blog/auth/providers/magic-link/send-magic-link-email/send-magic-link-email';
import { env } from '@blog/auth/utils/env/env';
import { withMinimumDuration } from '@blog/auth/utils/with-minimum-duration/with-minimum-duration';
import {
  MAGIC_LINK_REFUSAL,
  type TAuthApp,
  type TMagicLinkRefusal,
} from '@blog/config/constants';
import type { IMagicLinkSendRefusal } from '@blog/config/types';
import type { EmailConfig } from 'next-auth/providers/email';

// Above a typical lookup-and-Resend round trip, so a refused send is not measurably faster than a real one.
const MAGIC_LINK_RESPONSE_FLOOR_MS = 1500;

export const MAGIC_LINK_PROVIDER_ID = 'email';

const SEND_LIMIT_REFUSALS: ReadonlySet<TMagicLinkRefusal> = new Set([
  MAGIC_LINK_REFUSAL.NETWORK_LIMIT,
  MAGIC_LINK_REFUSAL.ADDRESS_LIMIT,
]);

export function buildMagicLinkProvider(
  app: TAuthApp,
  onSendRefused: (refusal: IMagicLinkSendRefusal) => void,
): EmailConfig {
  const from = resolveMagicLinkFromAddress(env.MAGIC_LINK_FROM_ADDRESS);

  return {
    id: MAGIC_LINK_PROVIDER_ID,
    type: 'email',
    name: 'Email',
    from,
    sendVerificationRequest: ({ identifier, url, request }) =>
      withMinimumDuration(MAGIC_LINK_RESPONSE_FLOOR_MS, async () => {
        const refusal = await findMagicLinkSendRefusal(identifier, request);
        if (refusal) {
          onSendRefused(refusal);
          if (SEND_LIMIT_REFUSALS.has(refusal.reason)) {
            throw new MagicLinkSendLimitedError();
          }
          // A block or a failed check lands on the same check-your-inbox page as a real send, so a block is never confirmed.
          return;
        }

        await sendMagicLinkEmail({ app, from, identifier, url });
      }),
  };
}
