'use server';

import { queries } from '@blog/db';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

const deleteLeadInputSchema = z.object({
  tenantId: z.string().uuid(),
  id: z.string().uuid(),
});

export type TDeleteLeadResult =
  { ok: true } | { ok: false; reason: 'invalid' | 'notFound' | 'failed' };

export const deleteLeadAction = async (
  tenantId: string,
  id: string,
): Promise<TDeleteLeadResult> => {
  const parsed = deleteLeadInputSchema.safeParse({ tenantId, id });
  if (!parsed.success) return { ok: false, reason: 'invalid' };

  const { tenant } = await requireTenantOwner(parsed.data.tenantId);

  try {
    const isDeleted = await queries.leads.deleteLead({
      tenantId: tenant.id,
      id: parsed.data.id,
    });
    return isDeleted ? { ok: true } : { ok: false, reason: 'notFound' };
  } catch (error) {
    logger.error('leads.delete_failed', { tenantId: tenant.id, error });
    return { ok: false, reason: 'failed' };
  }
};
