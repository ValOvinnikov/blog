import 'server-only';

import type { TEmailTag } from '@blog/email/tags';
import { env } from '@blog/email/utils/env/env';
import { isUndefined } from '@blog/utils/primitives';
import { Resend } from 'resend';

import { isValidEmailAddress } from '@blog/email/validation';

export type TSendEmailInput = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  replyTo?: string;
  tags?: TEmailTag[];
};

/** Strips line breaks from a subject so authored copy can never inject a mail header. */
function sanitizeEmailSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, ' ');
}

let resendClient: Resend | undefined;

function getResendClient(): Resend {
  resendClient ??= new Resend(env.RESEND_API_KEY);

  return resendClient;
}

export async function sendEmail({
  to,
  from,
  subject,
  html,
  text,
  headers,
  replyTo,
  tags,
}: TSendEmailInput): Promise<void> {
  if (!isUndefined(replyTo) && !isValidEmailAddress(replyTo)) {
    throw new Error('sendEmail received a malformed replyTo address');
  }

  const { error } = await getResendClient().emails.send({
    to,
    from,
    subject: sanitizeEmailSubject(subject),
    html,
    text,
    headers,
    replyTo,
    tags,
  });

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }
}
