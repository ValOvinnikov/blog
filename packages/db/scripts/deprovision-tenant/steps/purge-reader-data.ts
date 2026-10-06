import {
  countBookmarksForTenant,
  deleteBookmarksForTenant,
} from '@blog/db/queries/bookmarks';
import {
  countMembershipInvitesForTenant,
  deleteMembershipInvitesForTenant,
} from '@blog/db/queries/membership-invites';
import {
  countSubscribersForTenant,
  deleteSubscribersForTenant,
} from '@blog/db/queries/subscribers';
import type { TTenant } from '@blog/db/schema/tenants';

import type { TDeprovisionEnv } from '../lib/env';
import { recordReaderDataPurgeAuditEvent } from '../lib/record-reader-data-purge-audit-event';

/**
 * Step 6 — permanently deletes the tenant's readers' personal data:
 * `subscribers`, `bookmarks` and `membership_invites`. Runs after
 * `archive-tenant` so the row is already soft-deleted before its readers'
 * data is gone. Leaves `memberships` (who owned and ran the site), the
 * tenant's own configuration tables, `findings` and the `tenants` row
 * itself untouched — those cascade-delete only on a hard delete, which this
 * step never performs.
 */
export async function purgeTenantReaderData(
  tenant: TTenant,
  env: TDeprovisionEnv,
): Promise<void> {
  if (env.dryRun) {
    const [subscribers, bookmarks, membershipInvites] = await Promise.all([
      countSubscribersForTenant(tenant.id),
      countBookmarksForTenant(tenant.id),
      countMembershipInvitesForTenant(tenant.id),
    ]);
    console.warn(
      `[dry-run] would purge reader data for tenant "${tenant.id}": ${subscribers} subscriber(s), ${bookmarks} bookmark(s), ${membershipInvites} membership invite(s).`,
    );
    return;
  }

  const [subscribers, bookmarks, membershipInvites] = await Promise.all([
    deleteSubscribersForTenant(tenant.id),
    deleteBookmarksForTenant(tenant.id),
    deleteMembershipInvitesForTenant(tenant.id),
  ]);
  console.warn(
    `deprovision-tenant: purged reader data for tenant "${tenant.id}": ${subscribers} subscriber(s), ${bookmarks} bookmark(s), ${membershipInvites} membership invite(s).`,
  );

  await recordReaderDataPurgeAuditEvent(tenant.id, env, {
    subscribers,
    bookmarks,
    membershipInvites,
  });
}
