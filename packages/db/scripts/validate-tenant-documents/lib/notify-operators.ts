import {
  FINDING_SEVERITY,
  type TFindingSeverity,
} from '@blog/config/constants';
import { listSuperadminEmails } from '@blog/db/queries/admins';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { Resend } from 'resend';

// Resend's own shared testing sender, same fallback string
// `@blog/auth`/`apps/web`/`apps/platform`/`recheck-tenant-owners` already use
// until a verified sending domain is configured.
const DEFAULT_FROM_ADDRESS = 'Tenant Alerts <onboarding@resend.dev>';

// `tenant.name` is operator-entered and gets interpolated straight into this
// email's HTML body — escape every interpolated field rather than trust any
// one of them individually.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type TNotifyOperatorsParams = {
  tenant: TTenant;
  invalidDocumentCount: number;
  severity: TFindingSeverity;
  resendApiKey: string | undefined;
};

/**
 * Emails every SUPERADMIN admin the first time a tenant's document
 * validation newly transitions into a failing state — the caller
 * (`validateOne`) is responsible for the de-dup check via `isNewlyOpened`.
 * Never throws: a notification failure must never fail the sweep it's
 * reporting on.
 */
export async function notifyOperatorsOfDocumentValidationFailure({
  tenant,
  invalidDocumentCount,
  severity,
  resendApiKey,
}: TNotifyOperatorsParams): Promise<void> {
  if (!resendApiKey) {
    console.log(
      `validate-tenant-documents: RESEND_API_KEY is unset — skipping operator notification for tenant "${tenant.id}" ("${tenant.name}").`,
    );
    return;
  }

  try {
    const recipients = await listSuperadminEmails();
    if (recipients.length === 0) {
      console.log(
        `validate-tenant-documents: no SUPERADMIN admins on file — skipping operator notification for tenant "${tenant.id}" ("${tenant.name}").`,
      );
      return;
    }

    const severityCopy =
      severity === FINDING_SEVERITY.CRITICAL
        ? 'at least one document fails schema validation with an error-level marker'
        : 'documents have warning-level schema validation markers';

    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: DEFAULT_FROM_ADDRESS,
      to: recipients,
      subject: `Tenant "${tenant.name}" (${tenant.id}) has invalid Sanity documents`,
      html: `<p>Tenant <strong>${escapeHtml(tenant.name)}</strong> (id <code>${escapeHtml(tenant.id)}</code>) — ${severityCopy}. ${invalidDocumentCount} document(s) failed validation.</p><p>See the tenant's detail page in the platform admin panel for the full list.</p>`,
    });

    if (error) {
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
  } catch (error) {
    console.error(
      `validate-tenant-documents: failed to notify operators for tenant "${tenant.id}" ("${tenant.name}"): ${sanitizeLogMessage(error)}`,
    );
  }
}
