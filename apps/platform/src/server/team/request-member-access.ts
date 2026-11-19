import 'server-only';

import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import {
  enqueueOwnerAccessRequest,
  type TOwnerAccessRequestResult,
} from '@platform/server/owner-access/request-owner-access';
import { queries } from '@shinefold/db';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { notFound } from 'next/navigation';

import { teamTargetIdSchema } from './team-input';

const isUnlockedEditor = async (tenantId: string, membershipId: string) =>
  teamTargetIdSchema.safeParse(membershipId).success &&
  (await queries.memberships.getMemberStudioAccess(tenantId, membershipId))
    ?.role === MEMBERSHIP_ROLE.EDITOR;

export const requestMemberAccess = async (
  path: string,
  tenantId: string,
  membershipId: string,
): Promise<TOwnerAccessRequestResult> => {
  await requireTenantOwnerOrAdmin(tenantId, isSuperAdmin);

  if (!(await isUnlockedEditor(tenantId, membershipId))) {
    notFound();
  }

  return enqueueOwnerAccessRequest(path, tenantId, { membershipId });
};
