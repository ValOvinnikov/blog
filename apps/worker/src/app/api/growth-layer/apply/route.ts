import { HTTP_STATUS } from '@shinefold/config/constants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { GROWTH_LAYER_LOG } from '@worker/constants/growth-layer';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedTenantRequest,
  refuseUnwritableTenant,
  respond,
  respondError,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { applyGrowthLayerOnUpgrade } from '@worker/workflows/apply-growth-layer-on-upgrade';
import { start } from 'workflow/api';

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedTenantRequest(request);
  if (!signed.ok) return signed.error;
  const tenantId = signed.data;

  try {
    const refusal = await refuseUnwritableTenant(tenantId);
    if (refusal) return refusal;

    const run = await start(applyGrowthLayerOnUpgrade, [tenantId]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error(GROWTH_LAYER_LOG.APPLY_START_FAILED, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
