import {
  renderEmailAction,
  type TEmailAction,
  type TEmailLink,
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
  secondaryLink?: TEmailLink;
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
  secondaryLink,
}: TOwnerEmailInput): TOwnerEmail {
  const paragraphsHtml = paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('');
  const hasDetails = hasLength(details);
  const bodyHtml = hasDetails
    ? paragraphsHtml + renderEmailDetails(details)
    : paragraphsHtml;
  const actions: TEmailAction[] = [
    ...(action ? [action] : []),
    ...(secondaryLink ? [{ ...secondaryLink, variant: 'link' as const }] : []),
  ];

  return {
    subject,
    html: buildPlatformShell({
      brandName,
      title: subject,
      previewText,
      bodyHtml,
      actionHtml: hasLength(actions)
        ? actions
            .map((emailAction) =>
              renderEmailAction(emailAction, PLATFORM_EMAIL_BRAND),
            )
            .join('')
        : undefined,
    }),
    text: buildPlainTextBody(
      hasDetails ? [...paragraphs, detailsAsPlainText(details)] : paragraphs,
      ...actions,
    ),
  };
}
