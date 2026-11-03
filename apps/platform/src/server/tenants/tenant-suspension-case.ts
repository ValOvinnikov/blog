import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { queries, type TSuspensionCategory } from '@blog/db';
import type { TTenantSuspension } from '@blog/db/schema/tenant-suspensions';
import { TENANT_LOG } from '@platform/constants/tenant';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

export type TSuspensionCase = {
  category: TSuspensionCategory;
  description: string;
};

export const discardTenantSuspensionCase = async (
  suspension: TMaybeUndefined<TTenantSuspension>,
): Promise<void> => {
  if (!suspension) return;

  try {
    await queries.tenantSuspensions.discardTenantSuspension(suspension.id);
  } catch (error) {
    logger.error(TENANT_LOG.SUSPENSION_CASE_DISCARD_FAILED, {
      tenantId: suspension.tenantId,
      reference: suspension.reference,
      ...toLoggableError(error),
    });
  }
};
