import 'server-only';

import type { TEmailTag } from '@blog/email/tags';
import {
  EMAIL_ACCOUNT,
  type TEmailAccount,
} from '@blog/email/transport/email-account';
import { SendEmailError } from '@blog/email/transport/send-email-error';
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
  idempotencyKey?: string;
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
  idempotencyKey,
}: TSendEmailInput): Promise<void> {
  if (!isUndefined(replyTo) && !isValidEmailAddress(replyTo)) {
    throw new Error('sendEmail received a malformed replyTo address');
  }

  const payload = {
    to,
    from,
    subject: sanitizeEmailSubject(subject),
    html,
    text,
    headers,
    replyTo,
    tags,
  };
  const { emails } = getResendClient(account);
  const { error } = await (isUndefined(idempotencyKey)
    ? emails.send(payload)
    : emails.send(payload, { idempotencyKey }));

  if (error) {
    throw new SendEmailError(error.message, error.statusCode, error.name);
  }
}
