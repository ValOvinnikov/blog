'use server';

import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import { queries } from '@blog/db';
import { OWNER_INVITE_RESEND_PATH } from '@platform/constants/owner-access';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { enqueueOwnerAccessRequest } from '@platform/server/owner-access/request-owner-access';
import { z } from 'zod';

const formerOwnerEmailSchema = z.string().trim().toLowerCase().email();

export type TResendChangedOwnerStudioInviteResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  'formerOwnerEmail',
  typeof TENANT_FIELD_ERROR.EMAIL_INVALID,
  typeof TENANT_REFUSAL.NOT_FOUND | typeof TENANT_REFUSAL.STUDIO_NOT_PROVISIONED
>;

export const resendChangedOwnerStudioInviteAction = async (
  tenantId: string,
  formerOwnerEmail: string,
): Promise<TResendChangedOwnerStudioInviteResult> => {
  await requireAdmin();

  const parsed = formerOwnerEmailSchema.safeParse(formerOwnerEmail);
  if (!parsed.success) {
    return {
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        formerOwnerEmail: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID },
      },
    };
  }

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

  return enqueueOwnerAccessRequest(
    OWNER_INVITE_RESEND_PATH,
    tenantId,
    parsed.data,
  );
};
