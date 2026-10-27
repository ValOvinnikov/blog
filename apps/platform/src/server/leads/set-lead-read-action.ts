'use server';

import { ACTION_OUTCOME, type TActionResult } from '@blog/config';
import { queries } from '@blog/db';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  LEAD_LOG,
  LEAD_REFUSAL,
  type TLeadRefusal,
} from '@platform/constants/lead';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const setLeadReadInputSchema = z.object({
  tenantId: z.uuid(),
  id: z.uuid(),
  isRead: z.boolean(),
});

export type TSetLeadReadResult = TActionResult<
  typeof ACTION_OUTCOME.REFUSED | typeof ACTION_OUTCOME.SERVER_ERROR,
  keyof z.input<typeof setLeadReadInputSchema>,
  never,
  TLeadRefusal
>;

export const setLeadReadAction = async (
  tenantId: string,
  id: string,
  isRead: boolean,
): Promise<TSetLeadReadResult> => {
  const parsed = setLeadReadInputSchema.safeParse({ tenantId, id, isRead });
  if (!parsed.success) {
    return { outcome: ACTION_OUTCOME.INVALID, fieldErrors: {} };
  }

  const { tenant } = await requireTenantOwner(parsed.data.tenantId);
  const key = { tenantId: tenant.id, id: parsed.data.id };

  try {
    const isUpdated = parsed.data.isRead
      ? await queries.leads.markLeadRead(key)
      : await queries.leads.markLeadUnread(key);
    return isUpdated
      ? toOutcome(ACTION_OUTCOME.SUCCESS)
      : { outcome: ACTION_OUTCOME.REFUSED, reason: LEAD_REFUSAL.NOT_FOUND };
  } catch (error) {
    logger.error(LEAD_LOG.READ_STATE_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
    return toOutcome(ACTION_OUTCOME.SERVER_ERROR);
  }
};
