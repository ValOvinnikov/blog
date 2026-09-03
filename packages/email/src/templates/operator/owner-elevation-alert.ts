import { buildEmailShell } from '@blog/email/html/email-shell';
import { escapeHtml } from '@blog/email/html/escape-html';

const OUTCOME_COPY = {
  STALLED:
    "the tenant's owner still hasn't accepted their Sanity invite — administrator grant is stalled.",
  AMBIGUOUS_MEMBERSHIP:
    "the tenant's Sanity project has more than one human member, so it isn't clear which is the owner — no role was granted.",
} as const;

export type TOwnerElevationAlertInput = {
  tenantName: string;
  tenantId: string;
  outcome: keyof typeof OUTCOME_COPY;
};

/** Operator alert for a tenant whose owner elevation needs a human. */
export function buildOwnerElevationAlertEmail({
  tenantName,
  tenantId,
  outcome,
}: TOwnerElevationAlertInput): { subject: string; html: string } {
  const bodyHtml = `<p>Tenant <strong>${escapeHtml(tenantName)}</strong> (id <code>${escapeHtml(tenantId)}</code>) — ${OUTCOME_COPY[outcome]}</p><p>See the tenant's provisioning page in the platform admin panel for detail.</p>`;

  return {
    subject: `Tenant "${tenantName}" (${tenantId}) needs owner-elevation attention`,
    html: buildEmailShell({
      brandName: 'Tenant Alerts',
      previewText: `${tenantName} needs owner-elevation attention`,
      bodyHtml,
    }),
  };
}
