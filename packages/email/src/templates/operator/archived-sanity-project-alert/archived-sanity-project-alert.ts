import { renderEmailAction } from '@shinefold/email/html/email-action/email-action';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { buildOperatorShell } from '@shinefold/email/html/operator-shell/operator-shell';
import { PLATFORM_EMAIL_BRAND } from '@shinefold/email/html/platform-email-brand/platform-email-brand';
import { buildPlainTextBody } from '@shinefold/email/plain-text/plain-text-body';

export type TArchivedSanityProjectAlertInput = {
  tenantName: string;
  tenantId: string;
  sanityProjectId: string;
  manageUrl: string;
};

export function buildArchivedSanityProjectAlertEmail({
  tenantName,
  tenantId,
  sanityProjectId,
  manageUrl,
}: TArchivedSanityProjectAlertInput): {
  subject: string;
  html: string;
  text: string;
} {
  const paragraphs = [
    `Tenant ${tenantName} (id ${tenantId}) has been deprovisioned. Its Sanity project ${sanityProjectId} is archived, not deleted.`,
    'Delete the project in Sanity Manage. Deprovisioning cannot delete it for you.',
  ];
  const action = { label: 'Open the project in Sanity Manage', url: manageUrl };

  return {
    subject: `Delete the archived Sanity project of tenant "${tenantName}" (${tenantId})`,
    html: buildOperatorShell({
      previewText: `Delete Sanity project ${sanityProjectId} in Sanity Manage`,
      bodyHtml: paragraphs
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join(''),
      actionHtml: renderEmailAction(action, PLATFORM_EMAIL_BRAND),
    }),
    text: buildPlainTextBody(paragraphs, action),
  };
}
