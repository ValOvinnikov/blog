import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import type { TValueOf } from '@blog/config/utils';
import { queries, type TSuspensionCategory } from '@blog/db';
import type { TTenantSuspension } from '@blog/db/schema/tenant-suspensions';
import { TENANT_LOG } from '@platform/constants/tenant';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';

export type TSuspensionCase = {
  category: TSuspensionCategory;
  description: string;
};

const undoCaseWrite =
  (
    undo: (suspensionId: string) => Promise<void>,
    logEvent: TValueOf<typeof TENANT_LOG>,
  ) =>
  async (suspension: TMaybeUndefined<TTenantSuspension>): Promise<void> => {
    if (!suspension) return;

    try {
      await undo(suspension.id);
    } catch (error) {
      logger.error(logEvent, {
        tenantId: suspension.tenantId,
        reference: suspension.reference,
        ...toLoggableError(error),
      });
    }
  };

export const discardTenantSuspensionCase = undoCaseWrite(
  (suspensionId) =>
    queries.tenantSuspensions.discardTenantSuspension(suspensionId),
  TENANT_LOG.SUSPENSION_CASE_DISCARD_FAILED,
);

export const reopenTenantSuspensionCase = undoCaseWrite(
  (suspensionId) =>
    queries.tenantSuspensions.reopenTenantSuspension(suspensionId),
  TENANT_LOG.SUSPENSION_CASE_REOPEN_FAILED,
);
