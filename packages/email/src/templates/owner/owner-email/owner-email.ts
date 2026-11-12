import {
  renderEmailAction,
  type TEmailAction,
} from '@blog/email/html/email-action/email-action';
import {
  detailsAsPlainText,
  renderEmailDetails,
  type TEmailDetail,
} from '@blog/email/html/email-details/email-details';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import { buildPlatformShell } from '@blog/email/html/platform-shell/platform-shell';
import { buildPlainTextBody } from '@blog/email/plain-text/plain-text-body';
import { hasLength } from '@blog/utils/primitives';

export type TOwnerEmailInput = {
  brandName: string;
  subject: string;
  previewText?: string;
  paragraphs: string[];
  details?: TEmailDetail[];
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
  details,
  action,
}: TOwnerEmailInput): TOwnerEmail {
  const paragraphsHtml = paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
  const hasDetails = hasLength(details);
  const bodyHtml = hasDetails
    ? paragraphsHtml + renderEmailDetails(details)
    : paragraphsHtml;

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
    text: buildPlainTextBody(
      hasDetails ? [...paragraphs, detailsAsPlainText(details)] : paragraphs,
      action,
    ),
  };
}
