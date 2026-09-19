import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  type TElevateTenantOwnerOutcome,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TProvisionEnv } from '../lib/env';
import {
  grantSanityProjectRole,
  listSanityProjectAcl,
} from '../lib/sanity-management-client';

const OWNER_ELEVATION_ROLE = 'administrator';

// How long an owner may sit un-accepted before a run reports STALLED rather
// than PENDING_ACCEPTANCE — long enough that a same-day signup isn't flagged,
// short enough that a quiet non-acceptance still surfaces promptly.
export const OWNER_ACCEPTANCE_STALL_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 3;

/**
 * Promotes the tenant owner from `viewer` to `administrator` once they've
 * accepted their Sanity invite. Called once, right after core provisioning,
 * by `provision-tenant/run.ts`, and again on a recurring schedule by
 * `scripts/recheck-tenant-owners/run.ts` for owners who accept later.
 * A pending invitee never appears in the ACL listing, so its absence is not
 * an error — this reports a time-bound PENDING_ACCEPTANCE/STALLED outcome
 * instead of throwing, so a slow (or never) acceptance can never fail an
 * otherwise-successful provisioning run. Checks live ACL state rather than
 * any local record, so re-running against an already-administrator owner is
 * a safe no-op.
 */
export async function elevateTenantOwner(
  tenant: TTenant,
  env: TProvisionEnv,
): Promise<TElevateTenantOwnerOutcome> {
  const { sanityProjectId } = tenant;
  if (!sanityProjectId) {
    return ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE;
  }

  const acl = await listSanityProjectAcl({
    token: env.sanityManagementToken,
    projectId: sanityProjectId,
  });

  const humanEntries = acl.filter((entry) => !entry.isRobot);

  if (humanEntries.length > 1) {
    return ELEVATE_TENANT_OWNER_OUTCOME.AMBIGUOUS_MEMBERSHIP;
  }

  const [ownerEntry] = humanEntries;

  if (!ownerEntry) {
    const elapsedMs = Date.now() - tenant.createdAt.getTime();
    return elapsedMs >= OWNER_ACCEPTANCE_STALL_THRESHOLD_MS
      ? ELEVATE_TENANT_OWNER_OUTCOME.STALLED
      : ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE;
  }

  const isAlreadyAdministrator = ownerEntry.roles.some(
    (role) => role.name === OWNER_ELEVATION_ROLE,
  );
  if (isAlreadyAdministrator) {
    return ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR;
  }

  await grantSanityProjectRole({
    token: env.sanityManagementToken,
    projectId: sanityProjectId,
    projectUserId: ownerEntry.projectUserId,
    role: OWNER_ELEVATION_ROLE,
  });

  return ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED;
}
