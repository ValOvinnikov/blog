'use server';

import {
  requestOwnerAccess,
  type TOwnerAccessRequestResult,
} from './request-owner-access';

const CHECK_PATH = '/api/owner-access/check';

export const checkOwnerAccessAction = async (
  tenantId: string,
): Promise<TOwnerAccessRequestResult> =>
  requestOwnerAccess(CHECK_PATH, tenantId);
