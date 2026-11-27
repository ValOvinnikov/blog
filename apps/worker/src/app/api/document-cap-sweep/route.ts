import { HTTP_STATUS } from '@shinefold/config/constants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { DOCUMENT_CAP_LOG } from '@worker/constants/document-cap';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { rejectCronRequest } from '@worker/utils/cron-request/cron-request';
import { runDocumentCapSweep } from '@worker/utils/document-cap-sweep/run-document-cap-sweep';
import { logger } from '@worker/utils/logger/logger';
import { respondError } from '@worker/utils/signed-tenant-request/signed-tenant-request';

// Next requires a literal here, so it cannot import a const.
export const maxDuration = 300;

export async function GET(request: Request): Promise<Response> {
  const rejection = rejectCronRequest(
    request,
    DOCUMENT_CAP_LOG.SWEEP_NOT_CONFIGURED,
  );
  if (rejection) return rejection;

  try {
    const result = await runDocumentCapSweep();
    return Response.json(result, { status: HTTP_STATUS.OK });
  } catch (error) {
    logger.error(DOCUMENT_CAP_LOG.SWEEP_FAILED, {
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
