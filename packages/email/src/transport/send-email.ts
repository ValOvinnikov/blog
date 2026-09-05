import 'server-only';

import { env } from '@blog/email/utils/env/env';
import { Resend } from 'resend';

const REPLY_TO_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type TSendEmailInput = {
  to: string;
  from: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
  /** A tenant-supplied reply-to address. Must be a syntactically well-formed email address; domain authorisation and deliverability policy are the caller's concern. */
  replyTo?: string;
};

let resendClient: Resend | undefined;

/** Lazy singleton — mirrors `@blog/db`'s `getDb()`, avoids constructing a client until the first send. */
function getResendClient(): Resend {
  resendClient ??= new Resend(env.RESEND_API_KEY);

  return resendClient;
}

/**
 * The single Resend-backed transport every email builder in this repo sends
 * through — deliberately generic (`to`/`from`/`subject`/`html`, plus optional
 * mail headers) so callers as different as the Auth.js magic-link provider
 * and the newsletter confirmation email can share it without reshaping it
 * around either one.
 */
export async function sendEmail({
  to,
  from,
  subject,
  html,
  headers,
  replyTo,
}: TSendEmailInput): Promise<void> {
  if (replyTo !== undefined && !REPLY_TO_PATTERN.test(replyTo)) {
    throw new Error('sendEmail received a malformed replyTo address');
  }

  const { error } = await getResendClient().emails.send({
    to,
    from,
    subject,
    html,
    headers,
    replyTo,
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}
