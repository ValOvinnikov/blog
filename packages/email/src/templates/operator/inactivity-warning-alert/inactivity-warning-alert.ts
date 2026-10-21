import { renderEmailAction } from '@blog/email/html/email-action/email-action';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { buildOperatorShell } from '@blog/email/html/operator-shell/operator-shell';
import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';
import { buildPlainTextBody } from '@blog/email/plain-text/plain-text-body';

export type TInactivityWarningAlertInput = {
  tenantName: string;
  tenantId: string;
  ownerEmail: string;
  pauseDate: string;
  signInUrl: string;
};

export function buildInactivityWarningAlertEmail({
  tenantName,
  tenantId,
  ownerEmail,
  pauseDate,
  signInUrl,
}: TInactivityWarningAlertInput): {
  subject: string;
  html: string;
  text: string;
} {
  const paragraphs = [
    `Tenant ${tenantName} (id ${tenantId}) has had no sign-in for a while and will be paused on ${pauseDate}.`,
    `Its owner, ${ownerEmail}, has been sent the same warning.`,
  ];
  const action = { label: 'Open the platform admin panel', url: signInUrl };

  return {
    subject: `Tenant "${tenantName}" (${tenantId}) will be paused on ${pauseDate}`,
    html: buildOperatorShell({
      previewText: `${tenantName} will be paused on ${pauseDate}`,
      bodyHtml: paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join(''),
      actionHtml: renderEmailAction(action, PLATFORM_EMAIL_BRAND),
    }),
    text: buildPlainTextBody(paragraphs, action),
  };
}
