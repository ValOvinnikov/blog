'use server';

import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import { LEAD_REFUSAL, type TLeadRefusal } from '@platform/constants/lead';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const deleteLeadInputSchema = z.object({
  tenantId: z.string().uuid(),
  id: z.string().uuid(),
});

export type TDeleteLeadResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  keyof z.input<typeof deleteLeadInputSchema>,
  never,
  TLeadRefusal
>;

export const deleteLeadAction = async (
  tenantId: string,
  id: string,
): Promise<TDeleteLeadResult> => {
  const parsed = deleteLeadInputSchema.safeParse({ tenantId, id });
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantOwner(parsed.data.tenantId);

  try {
    const isDeleted = await queries.leads.deleteLead({
      tenantId: tenant.id,
      id: parsed.data.id,
    });
    return isDeleted
      ? toOutcome(ACTION_OUTCOME.SUCCESS)
      : { outcome: ACTION_OUTCOME.REFUSED, reason: LEAD_REFUSAL.NOT_FOUND };
  } catch (error) {
    logger.error('leads.delete_failed', { tenantId: tenant.id, error });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
