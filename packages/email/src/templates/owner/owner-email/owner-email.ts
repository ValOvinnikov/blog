import {
  renderEmailAction,
  type TEmailAction,
} from '@blog/email/html/email-action/email-action';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import { buildPlatformShell } from '@blog/email/html/platform-shell/platform-shell';
import { buildPlainTextBody } from '@blog/email/plain-text/plain-text-body';

export type TOwnerEmailInput = {
  brandName: string;
  subject: string;
  previewText?: string;
  paragraphs: string[];
  action?: TEmailAction;
};

export type TOwnerEmail = {
  subject: string;
  html: string;
  text: string;
};

export function buildOwnerEmail({
  brandName,
  subject,
  previewText,
  paragraphs,
  action,
}: TOwnerEmailInput): TOwnerEmail {
  const bodyHtml = paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');

  return {
    subject,
    html: buildPlatformShell({
      brandName,
      title: subject,
      previewText,
      bodyHtml,
      actionHtml: action
        ? renderEmailAction(action, PLATFORM_EMAIL_BRAND)
        : undefined,
    }),
    text: buildPlainTextBody(paragraphs, action),
  };
}
