'use server';

import { LEAD_LOG } from '@platform/constants/lead';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

import { listInboxLeads, type TInboxLeadsPage } from './list-inbox-leads';

const loadMoreLeadsInputSchema = z.object({
  tenantId: z.uuid(),
  after: z.object({ createdAt: z.string().min(1), id: z.uuid() }),
});

export type TLoadMoreLeadsResult =
  { isLoaded: true; page: TInboxLeadsPage } | { isLoaded: false };

export const loadMoreLeadsAction = async (
  tenantId: string,
  after: z.input<typeof loadMoreLeadsInputSchema>['after'],
): Promise<TLoadMoreLeadsResult> => {
  const parsed = loadMoreLeadsInputSchema.safeParse({ tenantId, after });
  if (!parsed.success) return { isLoaded: false };

  const { tenant } = await requireTenantOwner(parsed.data.tenantId);

  try {
    return {
      isLoaded: true,
      page: await listInboxLeads(tenant.id, parsed.data.after),
    };
  } catch (error) {
    logger.error(LEAD_LOG.LOAD_FAILED, {
      tenantId: tenant.id,
      ...toLoggableError(error),
    });
    return { isLoaded: false };
  }
};
