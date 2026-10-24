import { isMagicLinkSendAllowed } from '@blog/auth/providers/magic-link/is-magic-link-send-allowed/is-magic-link-send-allowed';
import { resolveMagicLinkFromAddress } from '@blog/auth/providers/magic-link/resolve-magic-link-from-address/resolve-magic-link-from-address';
import { sendMagicLinkEmail } from '@blog/auth/providers/magic-link/send-magic-link-email/send-magic-link-email';
import { env } from '@blog/auth/utils/env/env';
import { withMinimumDuration } from '@blog/auth/utils/with-minimum-duration/with-minimum-duration';
import type { TAuthApp } from '@blog/config/constants';
import type { EmailConfig } from 'next-auth/providers/email';

// Above a typical lookup-and-Resend round trip, so a refused send is not measurably faster than a real one.
const MAGIC_LINK_RESPONSE_FLOOR_MS = 1500;

export const MAGIC_LINK_PROVIDER_ID = 'email';

export function buildMagicLinkProvider(app: TAuthApp): EmailConfig {
  const from = resolveMagicLinkFromAddress(env.MAGIC_LINK_FROM_ADDRESS);

  return {
    id: MAGIC_LINK_PROVIDER_ID,
    type: 'email',
    name: 'Email',
    from,
    sendVerificationRequest: ({ identifier, url, request }) =>
      withMinimumDuration(MAGIC_LINK_RESPONSE_FLOOR_MS, async () => {
        // A refusal sends nothing and lands on the same check-your-inbox page as a real send.
        if (!(await isMagicLinkSendAllowed(identifier, request))) return;

        await sendMagicLinkEmail({ app, from, identifier, url });
      }),
  };
}
