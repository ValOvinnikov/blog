import { queries } from '@blog/db';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { logger } from '@web/utils/logger/logger';

export const recordTenantActivity = async (
  tenantId: string,
  at: Date,
): Promise<void> => {
  try {
    const result = await queries.tenants.touchTenantActivity(tenantId, at);
    if (!result.ok) {
      logger.error(REVALIDATE_LOG.TENANT_ACTIVITY_TOUCH_FAILED, {
        tenantId,
        error: result.error,
      });
    }
  } catch (error) {
    logger.error(REVALIDATE_LOG.TENANT_ACTIVITY_TOUCH_FAILED, {
      tenantId,
      error,
    });
  }
};
