import 'server-only';

import type { TEmailTag } from '@blog/email/tags';
import {
  EMAIL_ACCOUNT,
  type TEmailAccount,
} from '@blog/email/transport/email-account';
import { env } from '@blog/email/utils/env/env';
import { isUndefined } from '@blog/utils/primitives';
import { Resend } from 'resend';

import { isValidEmailAddress } from '@blog/email/validation';

export type TSendEmailInput = {
  account: TEmailAccount;
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

function readApiKey(account: TEmailAccount): string | undefined {
  return account === EMAIL_ACCOUNT.PLATFORM
    ? env.RESEND_PLATFORM_API_KEY
    : env.RESEND_TENANT_API_KEY;
}

export function isEmailAccountConfigured(account: TEmailAccount): boolean {
  return !isUndefined(readApiKey(account));
}

const resendClients = new Map<TEmailAccount, Resend>();

function getResendClient(account: TEmailAccount): Resend {
  const cached = resendClients.get(account);
  if (cached) return cached;

  const apiKey = readApiKey(account);
  // Resend's constructor falls back to process.env.RESEND_API_KEY, so a missing key must throw here.
  if (isUndefined(apiKey)) {
    throw new Error(`No Resend API key is set for the ${account} account`);
  }
  const client = new Resend(apiKey);
  resendClients.set(account, client);

  return client;
}

export async function sendEmail({
  account,
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

  const { error } = await getResendClient(account).emails.send({
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
