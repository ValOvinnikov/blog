import { renderEmailAction } from '@blog/email/html/email-action/email-action';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { buildOperatorShell } from '@blog/email/html/operator-shell/operator-shell';
import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import { buildPlainTextBody } from '@blog/email/plain-text/plain-text-body';

export type TNewsletterReputationAlertInput = {
  tenantName: string;
  tenantId: string;
  bounceRate: number;
  complaintRate: number;
  resolvedCount: number;
  windowDays: number;
  isSendingPaused: boolean;
  adminUrl: string;
};

const RATE_FORMAT = new Intl.NumberFormat('en', {
  style: 'percent',
  maximumFractionDigits: 2,
});

export function buildNewsletterReputationAlertEmail({
  tenantName,
  tenantId,
  bounceRate,
  complaintRate,
  resolvedCount,
  windowDays,
  isSendingPaused,
  adminUrl,
}: TNewsletterReputationAlertInput): {
  subject: string;
  html: string;
  text: string;
} {
  const rates = `Over the last ${windowDays} days, ${RATE_FORMAT.format(bounceRate)} of its ${resolvedCount} delivered or bounced emails bounced and ${RATE_FORMAT.format(complaintRate)} were marked as spam.`;
  const consequence = isSendingPaused
    ? 'Its post emails are paused until an operator clears the pause in the platform admin panel. Posts published meanwhile are not sent later.'
    : 'Its post emails still send. If the rates keep rising, sending slows and then pauses.';
  const paragraphs = [
    `Tenant ${tenantName} (id ${tenantId}) is close to harming the shared sending account's reputation.`,
    rates,
    consequence,
  ];
  const headline = isSendingPaused
    ? 'post emails paused'
    : 'post email delivery warning';
  const action = { label: 'Open the platform admin panel', url: adminUrl };

  return {
    subject: `Tenant "${tenantName}" (${tenantId}): ${headline}`,
    html: buildOperatorShell({
      previewText: `${tenantName}: ${headline}`,
      bodyHtml: paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join(''),
      actionHtml: renderEmailAction(action, PLATFORM_EMAIL_BRAND),
    }),
    text: buildPlainTextBody(paragraphs, action),
  };
}
