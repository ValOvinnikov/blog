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
 * sendEmail — the shared Resend "send email" helper (#1107). Deliberately
 * generic (`to`/`from`/`subject`/`html` only, no auth-specific fields) so the
 * Auth.js Email provider's magic-link (`@web/server/auth/auth.ts`) and, later,
 * the newsletter confirmation email (#1104) can both call it without either
 * feature reshaping it around the other's needs. Callers own their own
 * content (subject/html) and `from` address; this function only owns the
 * Resend client and surfaces a clear error on failure.
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
