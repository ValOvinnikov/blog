import 'server-only';

import { env } from '@web/utils/env/env';
import { Resend } from 'resend';

export type TSendEmailInput = {
  to: string;
  from: string;
  subject: string;
  html: string;
};

let resendClient: Resend | undefined;

/** Lazy singleton — mirrors `@blog/db`'s `getDb()`, avoids constructing a client until the first send. */
function getResendClient(): Resend {
  resendClient ??= new Resend(env.RESEND_API_KEY);

  return resendClient;
}

/**
 * The shared Resend "send email" helper — deliberately generic
 * (`to`/`from`/`subject`/`html` only, no auth-specific fields) so callers
 * like the Auth.js Email provider's magic-link and the newsletter
 * confirmation email can share it without either reshaping it around the
 * other's needs.
 */
export async function sendEmail({
  to,
  from,
  subject,
  html,
}: TSendEmailInput): Promise<void> {
  const { error } = await getResendClient().emails.send({
    to,
    from,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}
