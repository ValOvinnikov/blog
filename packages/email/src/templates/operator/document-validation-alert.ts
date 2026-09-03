import { buildEmailShell } from '@blog/email/html/email-shell';
import { escapeHtml } from '@blog/email/html/escape-html';

export type TDocumentValidationAlertInput = {
  tenantName: string;
  tenantId: string;
  invalidDocumentCount: number;
  isCritical: boolean;
};

/** Operator alert for a tenant with newly failing Sanity document validation. */
export function buildDocumentValidationAlertEmail({
  tenantName,
  tenantId,
  invalidDocumentCount,
  isCritical,
}: TDocumentValidationAlertInput): { subject: string; html: string } {
  const severityCopy = isCritical
    ? 'at least one document fails schema validation with an error-level marker'
    : 'documents have warning-level schema validation markers';
  const bodyHtml = `<p>Tenant <strong>${escapeHtml(tenantName)}</strong> (id <code>${escapeHtml(tenantId)}</code>) — ${severityCopy}. ${invalidDocumentCount} document(s) failed validation.</p><p>See the tenant's detail page in the platform admin panel for the full list.</p>`;

  return {
    subject: `Tenant "${tenantName}" (${tenantId}) has invalid Sanity documents`,
    html: buildEmailShell({
      brandName: 'Tenant Alerts',
      previewText: `${tenantName} has invalid Sanity documents`,
      bodyHtml,
    }),
  };
}
