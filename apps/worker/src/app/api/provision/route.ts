import { ERROR_CODE, HTTP_STATUS } from '@blog/config/constants';
import { beginTenantProvisioning } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { logger } from '@worker/utils/logger/logger';
import { markRunNotStarted } from '@worker/utils/provisioning-report/provisioning-report';
import {
  readSignedTenantRequest,
  respond,
  respondError,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { provisionTenant } from '@worker/workflows/provision-tenant';
import { start } from 'workflow/api';

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedTenantRequest(request);
  if (!signed.ok) return signed.response;
  const { tenantId } = signed;

  let began: Awaited<ReturnType<typeof beginTenantProvisioning>>;
  try {
    began = await beginTenantProvisioning(tenantId);
  } catch (error) {
    logger.error('provisioning.begin_failed', {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
  if (!began.ok) {
    if (began.error === ERROR_CODE.DB_ALREADY_PROVISIONING) {
      return respondError(
        HTTP_STATUS.CONFLICT,
        ENQUEUE_ERROR.ALREADY_IN_PROGRESS,
      );
    }
    if (began.error === ERROR_CODE.DB_NOT_FOUND) {
      return respondError(HTTP_STATUS.NOT_FOUND, ENQUEUE_ERROR.NOT_FOUND);
    }
    logger.error('provisioning.begin_failed', { tenantId, error: began.error });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }

  try {
    const run = await start(provisionTenant, [tenantId]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error('provisioning.start_failed', {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    await markRunNotStarted(tenantId);
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
