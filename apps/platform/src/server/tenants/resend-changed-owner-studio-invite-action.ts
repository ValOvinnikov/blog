'use server';

import {
  ACTION_OUTCOME,
  isOutcomeSuccess,
  type TActionResult,
} from '@blog/config';
import { queries } from '@blog/db';
import { OWNER_INVITE_RESEND_PATH } from '@platform/constants/owner-access';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { enqueueOwnerAccessRequest } from '@platform/server/owner-access/request-owner-access';

export type TResendChangedOwnerStudioInviteResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  typeof TENANT_REFUSAL.NOT_FOUND | typeof TENANT_REFUSAL.STUDIO_NOT_PROVISIONED
>;

export const resendChangedOwnerStudioInviteAction = async (
  tenantId: string,
): Promise<TResendChangedOwnerStudioInviteResult> => {
  await requireAdmin();

  const tenant = await queries.tenants.getTenantById(tenantId);
  if (!tenant) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    };
  }
  if (!tenant.sanityProjectId) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.STUDIO_NOT_PROVISIONED,
    };
  }

  const formerOwnerEmail =
    await queries.tenants.getUnsentStudioReinviteEmail(tenantId);
  const result = await enqueueOwnerAccessRequest(
    OWNER_INVITE_RESEND_PATH,
    tenantId,
    formerOwnerEmail ?? undefined,
  );
  if (isOutcomeSuccess(result)) {
    await queries.tenants.clearUnsentStudioReinvite(tenantId);
  }
  return result;
};
