'use server';

import { OWNER_INVITE_RESEND_PATH } from '@platform/constants/owner-access';

import {
  requestOwnerAccess,
  type TOwnerAccessRequestResult,
} from './request-owner-access';

export const resendOwnerInviteAction = async (
  tenantId: string,
): Promise<TOwnerAccessRequestResult> =>
  requestOwnerAccess(OWNER_INVITE_RESEND_PATH, tenantId);
