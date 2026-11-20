import { HTTP_STATUS } from '@shinefold/config/constants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { SAMPLE_CONTENT_LOG } from '@worker/constants/sample-content';
import { removeSampleContent } from '@worker/units/remove-sample-content';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedTenantRequest,
  refuseUnwritableTenant,
  respond,
  respondError,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';

// Next requires a literal here, so it cannot import a const.
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedTenantRequest(request);
  if (!signed.ok) return signed.error;
  const tenantId = signed.data;

  try {
    const refusal = await refuseUnwritableTenant(tenantId);
    if (refusal) return refusal;

    return respond(HTTP_STATUS.OK, await removeSampleContent(tenantId));
  } catch (error) {
    logger.error(SAMPLE_CONTENT_LOG.REMOVAL_FAILED, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
