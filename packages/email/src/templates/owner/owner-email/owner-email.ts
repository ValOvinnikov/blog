import {
  renderEmailAction,
  type TEmailAction,
} from '@shinefold/email/html/email-action/email-action';
import {
  detailsAsPlainText,
  renderEmailDetails,
  type TEmailDetail,
} from '@shinefold/email/html/email-details/email-details';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { PLATFORM_EMAIL_BRAND } from '@shinefold/email/html/platform-email-brand/platform-email-brand';
import { buildPlatformShell } from '@shinefold/email/html/platform-shell/platform-shell';
import { buildPlainTextBody } from '@shinefold/email/plain-text/plain-text-body';
import { hasLength } from '@shinefold/utils/primitives';

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
