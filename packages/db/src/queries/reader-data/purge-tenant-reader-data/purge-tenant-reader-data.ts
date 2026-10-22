import {
  countBookmarksForTenant,
  deleteBookmarksForTenant,
} from '@blog/db/queries/bookmarks';
import {
  countLeadsForTenant,
  deleteLeadsForTenant,
} from '@blog/db/queries/leads';
import {
  countMembershipInvitesForTenant,
  deleteMembershipInvitesForTenant,
} from '@blog/db/queries/membership-invites';
import {
  countSubscribersForTenant,
  deleteSubscribersForTenant,
} from '@blog/db/queries/subscribers';

export type TTenantReaderDataCounts = {
  subscribers: number;
  bookmarks: number;
  membershipInvites: number;
  leads: number;
};

export async function countTenantReaderData(
  tenantId: string,
): Promise<TTenantReaderDataCounts> {
  const [subscribers, bookmarks, membershipInvites, leads] = await Promise.all([
    countSubscribersForTenant(tenantId),
    countBookmarksForTenant(tenantId),
    countMembershipInvitesForTenant(tenantId),
    countLeadsForTenant(tenantId),
  ]);
  return { subscribers, bookmarks, membershipInvites, leads };
}

// Memberships, the tenant's configuration, findings and the tenants row are kept by design.
export async function purgeTenantReaderData(
  tenantId: string,
): Promise<TTenantReaderDataCounts> {
  const [subscribers, bookmarks, membershipInvites, leads] = await Promise.all([
    deleteSubscribersForTenant(tenantId),
    deleteBookmarksForTenant(tenantId),
    deleteMembershipInvitesForTenant(tenantId),
    deleteLeadsForTenant(tenantId),
  ]);
  return { subscribers, bookmarks, membershipInvites, leads };
}
