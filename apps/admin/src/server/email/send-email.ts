import 'server-only';

import { env } from '@admin/utils/env/env';
import type { TSendEmail } from '@blog/auth';
import { Resend } from 'resend';

let resendClient: Resend | undefined;

/** Lazy singleton — mirrors `@blog/db`'s `getDb()`, avoids constructing a client until the first send. */
const getResendClient = (): Resend => {
  resendClient ??= new Resend(env.RESEND_API_KEY);

  return resendClient;
};

/**
 * The magic-link email sender `buildAuthConfig` requires
 * (`packages/auth/src/config.ts`'s `TBuildAuthConfigOptions.sendEmail`).
 * `apps/web` has its own copy with the same shape — `@blog/auth` deliberately
 * has no room for an email SDK dependency, so each app supplies its own.
 */
export const sendEmail: TSendEmail = async ({ to, from, subject, html }) => {
  const { error } = await getResendClient().emails.send({
    to,
    from,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
};
