import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import { listSuperadminEmails } from '@blog/db/queries/admins';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { Resend } from 'resend';

// Resend's own shared testing sender, same fallback string
// `@blog/auth`/`apps/web`/`apps/platform` already use until a verified
// sending domain is configured — this script has no equivalent
// `*_FROM_ADDRESS` env var of its own.
const DEFAULT_FROM_ADDRESS = 'Tenant Alerts <onboarding@resend.dev>';

// The only two outcomes this function is ever called with — the caller
// guarantees it, since the other three outcomes are never actionable.
export type TNotifiableOutcome = Extract<
  TElevateTenantOwnerOutcome,
  'STALLED' | 'AMBIGUOUS_MEMBERSHIP'
>;

export function isNotifiableOutcome(
  outcome: TElevateTenantOwnerOutcome,
): outcome is TNotifiableOutcome {
  return (
    outcome === ELEVATE_TENANT_OWNER_OUTCOME.STALLED ||
    outcome === ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP
  );
}

const OUTCOME_COPY: Record<TNotifiableOutcome, string> = {
  [ELEVATE_TENANT_OWNER_OUTCOME.STALLED]:
    "the tenant's owner still hasn't accepted their Sanity invite — administrator grant is stalled.",
  [ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP]:
    "the tenant's Sanity project has more than one human member, so it isn't clear which is the owner — no role was granted.",
};

type TNotifyOperatorsParams = {
  tenant: TTenant;
  outcome: TNotifiableOutcome;
  resendApiKey: string | undefined;
};

/**
 * Emails every SUPERADMIN admin the first time a tenant's owner-elevation
 * outcome newly transitions into STALLED or AMBIGUOUS_MEMBERSHIP — the
 * caller (`recheckOne`) is responsible for the de-dup check against the
 * previously persisted outcome. Never throws: a notification failure must
 * never fail the sweep it's reporting on.
 */
export async function notifyOperatorsOfOwnerElevationOutcome({
  tenant,
  outcome,
  resendApiKey,
}: TNotifyOperatorsParams): Promise<void> {
  if (!resendApiKey) {
    console.log(
      `recheck-tenant-owners: RESEND_API_KEY is unset — skipping operator notification for tenant "${tenant.id}" (slug "${tenant.slug}").`,
    );
    return;
  }

  try {
    const recipients = await listSuperadminEmails();
    if (recipients.length === 0) {
      console.log(
        `recheck-tenant-owners: no SUPERADMIN admins on file — skipping operator notification for tenant "${tenant.id}" (slug "${tenant.slug}").`,
      );
      return;
    }

    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: DEFAULT_FROM_ADDRESS,
      to: recipients,
      subject: `Tenant "${tenant.name}" (${tenant.slug}) needs owner-elevation attention`,
      html: `<p>Tenant <strong>${tenant.name}</strong> (slug <code>${tenant.slug}</code>, id <code>${tenant.id}</code>) — ${OUTCOME_COPY[outcome]}</p><p>See the tenant's provisioning page in the platform admin panel for detail.</p>`,
    });

    if (error) {
      throw new Error(`Failed to send email via Resend: ${error.message}`);
    }
  } catch (error) {
    console.error(
      `recheck-tenant-owners: failed to notify operators for tenant "${tenant.id}" (slug "${tenant.slug}"): ${sanitizeLogMessage(error)}`,
    );
  }
}
