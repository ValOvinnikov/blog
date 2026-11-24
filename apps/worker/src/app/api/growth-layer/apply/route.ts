import { HTTP_STATUS } from '@shinefold/config/constants';
import { GROWTH_LAYER_LOG } from '@worker/constants/growth-layer';
import { handleSignedTenantRequest } from '@worker/utils/signed-tenant-request/handle-signed-tenant-request';
import {
  respond,
  tenantRequestBodySchema,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { applyGrowthLayerOnUpgrade } from '@worker/workflows/apply-growth-layer-on-upgrade';
import { start } from 'workflow/api';

export function POST(request: Request): Promise<Response> {
  return handleSignedTenantRequest(request, {
    schema: tenantRequestBodySchema,
    failureEvent: GROWTH_LAYER_LOG.APPLY_START_FAILED,
    run: async ({ tenantId }) => {
      const { runId } = await start(applyGrowthLayerOnUpgrade, [tenantId]);
      return respond(HTTP_STATUS.ACCEPTED, { runId });
    },
  });
}
