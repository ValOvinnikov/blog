import { renderEmailAction } from '@blog/email/html/email-action/email-action';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { buildOperatorShell } from '@blog/email/html/operator-shell/operator-shell';
import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import { buildPlainTextBody } from '@blog/email/plain-text/plain-text-body';

export const NEWSLETTER_REPUTATION_ALERT_LEVEL = {
  WARN: 'WARN',
  SLOW: 'SLOW',
  STOP: 'STOP',
} as const;

export type TNewsletterReputationAlertLevel =
  (typeof NEWSLETTER_REPUTATION_ALERT_LEVEL)[keyof typeof NEWSLETTER_REPUTATION_ALERT_LEVEL];

export type TNewsletterReputationAlertInput = {
  tenantName: string;
  tenantId: string;
  level: TNewsletterReputationAlertLevel;
  bounceRate: number;
  complaintRate: number;
  resolvedCount: number;
  windowDays: number;
  adminUrl: string;
};

// Three digits keep a rate just under a complaint threshold (0.056%) from printing as the next one up.
const RATE_FORMAT = new Intl.NumberFormat('en', {
  style: 'percent',
  maximumFractionDigits: 3,
});
const COUNT_FORMAT = new Intl.NumberFormat('en');

const LEVEL_COPY: Record<
  TNewsletterReputationAlertLevel,
  { headline: string; opening: string; consequence: string }
> = {
  [NEWSLETTER_REPUTATION_ALERT_LEVEL.WARN]: {
    headline: 'post email delivery warning',
    opening: 'is close to harming the shared sending account’s reputation.',
    consequence:
      'Its post emails still send at full speed. If the rates keep rising, sending slows and then pauses.',
  },
  [NEWSLETTER_REPUTATION_ALERT_LEVEL.SLOW]: {
    headline: 'post emails slowed',
    opening: 'is harming the shared sending account’s reputation.',
    consequence:
      'Its post emails now send slowly, a small batch an hour. If the rates keep rising, sending pauses.',
  },
  [NEWSLETTER_REPUTATION_ALERT_LEVEL.STOP]: {
    headline: 'post emails paused',
    opening: 'has crossed the shared sending account’s reputation limit.',
    consequence:
      'Its post emails are paused until an operator clears the pause in the platform admin panel. Posts published meanwhile are not sent later.',
  },
};

export function buildNewsletterReputationAlertEmail({
  tenantName,
  tenantId,
  level,
  bounceRate,
  complaintRate,
  resolvedCount,
  windowDays,
  adminUrl,
}: TNewsletterReputationAlertInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { headline, opening, consequence } = LEVEL_COPY[level];
  const paragraphs = [
    `Tenant ${tenantName} (id ${tenantId}) ${opening}`,
    `Over the last ${windowDays} days, ${RATE_FORMAT.format(bounceRate)} of its ${COUNT_FORMAT.format(resolvedCount)} delivered or bounced emails bounced and ${RATE_FORMAT.format(complaintRate)} were marked as spam.`,
    consequence,
  ];
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
