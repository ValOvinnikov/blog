import 'server-only';

import { queries } from '@blog/db';
import type { TMembership } from '@blog/db/schema/memberships';
import {
  type TPlatformTenant,
  toPlatformTenant,
} from '@platform/utils/platform-tenant/platform-tenant';
import { notFound } from 'next/navigation';

import { buildVirtualAdminMembership } from './build-virtual-admin-membership';
import { type TPlatformViewer, toPlatformViewer } from './platform-viewer';
import { requireSessionUserId } from './require-session-user-id';

export type TTenantMembershipContext = {
  tenant: TPlatformTenant;
  membership: TMembership;
  viewer: TPlatformViewer;
};

/** The tenant-section gate, called from a layout so every nested route is protected; an admin gets a virtual OWNER membership on any tenant. */
export const requireTenantMembership = async (
  tenantId: string,
): Promise<TTenantMembershipContext> => {
  const userId = await requireSessionUserId();
  const tenant = await queries.tenants.getTenantById(tenantId);

  if (!tenant) {
    notFound();
  }

  const admin = await queries.admins.getAdminByUserId(userId);

  const membership = admin
    ? buildVirtualAdminMembership(userId, tenant.id)
    : await queries.memberships.getMembership(userId, tenant.id);

  if (!membership) {
    notFound();
  }

  return {
    tenant: toPlatformTenant(tenant),
    membership,
    viewer: toPlatformViewer({ membership, admin }),
  };
};
