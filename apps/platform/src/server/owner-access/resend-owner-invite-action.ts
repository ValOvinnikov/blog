'use server';

import {
  requestOwnerAccess,
  type TOwnerAccessRequestResult,
} from './request-owner-access';

const RESEND_PATH = '/api/owner-access/resend';

export const resendOwnerInviteAction = async (
  tenantId: string,
): Promise<TOwnerAccessRequestResult> =>
  requestOwnerAccess(RESEND_PATH, tenantId);
