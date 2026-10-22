import { queries } from '@blog/db';
import { TENANT_ACTIVITY_TOUCH_FAILED_EVENT } from '@web/constants/revalidate';
import { logger } from '@web/utils/logger/logger';

export const recordTenantActivity = async (
  tenantId: string,
  at: Date,
): Promise<void> => {
  try {
    const result = await queries.tenants.touchTenantActivity(tenantId, at);
    if (!result.ok) {
      logger.error(TENANT_ACTIVITY_TOUCH_FAILED_EVENT, {
        tenantId,
        error: result.error,
      });
    }
  } catch (error) {
    logger.error(TENANT_ACTIVITY_TOUCH_FAILED_EVENT, { tenantId, error });
  }
};
