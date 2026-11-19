'use server';

import { MEMBER_ACCESS_PATH } from '@platform/constants/team-access';
import type { TOwnerAccessRequestResult } from '@platform/server/owner-access/request-owner-access';

import { requestMemberAccess } from './request-member-access';

export const resendMemberInviteAction = async (
  tenantId: string,
  membershipId: string,
): Promise<TOwnerAccessRequestResult> =>
  requestMemberAccess(MEMBER_ACCESS_PATH.RESEND, tenantId, membershipId);
