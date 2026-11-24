import { HTTP_STATUS } from '@shinefold/config/constants';
import { SAMPLE_CONTENT_LOG } from '@worker/constants/sample-content';
import { removeSampleContent } from '@worker/units/remove-sample-content';
import { handleSignedTenantRequest } from '@worker/utils/signed-tenant-request/handle-signed-tenant-request';
import {
  respond,
  tenantRequestBodySchema,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';

// Next requires a literal here, so it cannot import a const.
export const maxDuration = 300;

export function POST(request: Request): Promise<Response> {
  return handleSignedTenantRequest(request, {
    schema: tenantRequestBodySchema,
    failureEvent: SAMPLE_CONTENT_LOG.REMOVAL_FAILED,
    refusal: { requiresWritableStatus: true },
    run: async ({ tenantId }) =>
      respond(HTTP_STATUS.OK, await removeSampleContent(tenantId)),
  });
}
