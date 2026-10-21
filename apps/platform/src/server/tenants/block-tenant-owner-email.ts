import 'server-only';

import {
  ACTION_OUTCOME,
  type TOutcome,
  type TMaybeUndefined,
  type TReasonedFailure,
} from '@blog/config';
import { BLOCKED_IDENTITY_KIND, queries } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import { toOutcome } from '@blog/utils/to-outcome';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import { addSignupBlock } from '@platform/server/signup-block/add-signup-block';
import { logger } from '@platform/utils/logger/logger';

type TBlockTenantOwnerEmailFailure =
  | TOutcome<typeof ACTION_OUTCOME.SERVER_ERROR>
  | (TOutcome<typeof ACTION_OUTCOME.REFUSED> &
      TReasonedFailure<typeof TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN>);

export const blockTenantOwnerEmail = async (
  admin: TAdmin,
  tenantId: string,
  reason: string,
): Promise<TMaybeUndefined<TBlockTenantOwnerEmailFailure>> => {
  const ownerEmail = await queries.memberships.getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    return {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.OWNER_EMAIL_UNKNOWN,
    };
  }

  const blocked = await addSignupBlock({
    kind: BLOCKED_IDENTITY_KIND.ADDRESS,
    identity: ownerEmail,
    reason,
    admin,
  });
  if (blocked.ok) return undefined;

  logger.error('tenant.suspension_block_failed', {
    tenantId,
    error: blocked.error,
  });
  return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
};
