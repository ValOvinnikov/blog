import {
  detailsAsPlainText,
  renderEmailDetails,
} from '@shinefold/email/html/email-details/email-details';
import { renderEmailMessageQuote } from '@shinefold/email/html/email-message-quote/email-message-quote';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { buildOperatorShell } from '@shinefold/email/html/operator-shell/operator-shell';
import { PLATFORM_EMAIL_BRAND } from '@shinefold/email/html/platform-email-brand/platform-email-brand';
import { buildPlainTextBody } from '@shinefold/email/plain-text/plain-text-body';

export type TSupportRequestEmailInput = {
  subject: string;
  message: string;
  siteName: string;
  siteAddress: string;
  plan: string;
  status: string;
  senderEmail: string;
  senderRole: string;
  originPage?: string;
};

export type TSupportRequestEmail = {
  subject: string;
  html: string;
  text: string;
};

/** Send it with `replyTo` set to the sender, so a reply from support reaches them. */
export function buildSupportRequestEmail({
  subject,
  message,
  siteName,
  siteAddress,
  plan,
  status,
  senderEmail,
  senderRole,
  originPage,
}: TSupportRequestEmailInput): TSupportRequestEmail {
  const intro = `${senderEmail} sent a support message about ${siteName}.`;
  const details = [
    { label: 'Subject', value: subject },
    { label: 'Site', value: siteName },
    { label: 'Address', value: siteAddress },
    { label: 'Plan', value: plan },
    { label: 'Status', value: status },
    { label: 'Account', value: senderEmail },
    { label: 'Role', value: senderRole },
    { label: 'Sent from', value: originPage ?? 'Not recorded' },
  ];

  return {
    subject: `Support: ${subject} (${siteName})`,
    html: buildOperatorShell({
      previewText: intro,
      bodyHtml: [
        `<p style="margin:0 0 16px;">${escapeHtml(intro)}</p>`,
        renderEmailMessageQuote(message, PLATFORM_EMAIL_BRAND),
        renderEmailDetails(details),
      ].join(''),
    }),
    text: buildPlainTextBody([intro, message, detailsAsPlainText(details)]),
  };
}
