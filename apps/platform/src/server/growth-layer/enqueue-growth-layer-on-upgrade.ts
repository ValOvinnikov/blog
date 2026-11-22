import 'server-only';

import {
  GROWTH_LAYER_LOG,
  GROWTH_LAYER_PATH,
} from '@platform/constants/growth-layer';
import { enqueueWorkerRequest } from '@platform/server/provisioning/enqueue-provisioning';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_STATUS } from '@shinefold/config';
import { MODULE_PACK, type TTenantPlan } from '@shinefold/config/constants';
import { PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import { isNull, isOneOf } from '@shinefold/utils/primitives';

const hasGrowthPack = (plan: TTenantPlan): boolean =>
  isOneOf(PLAN_ENTITLEMENTS[plan].modulePacks, MODULE_PACK.GROWTH);

export const enqueueGrowthLayerOnUpgrade = async (
  tenantId: string,
  fromPlan: TTenantPlan,
  toPlan: TTenantPlan,
): Promise<void> => {
  if (hasGrowthPack(fromPlan) || !hasGrowthPack(toPlan)) return;

  const status = await enqueueWorkerRequest(GROWTH_LAYER_PATH.APPLY, {
    tenantId,
  });
  if (
    isNull(status) ||
    status === HTTP_STATUS.ACCEPTED ||
    status === HTTP_STATUS.CONFLICT
  ) {
    return;
  }

  logger.error(GROWTH_LAYER_LOG.APPLY_ENQUEUE_REJECTED, {
    tenantId,
    responseStatus: status,
  });
};
