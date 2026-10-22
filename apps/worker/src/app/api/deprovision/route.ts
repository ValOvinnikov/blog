import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { DEPROVISIONING_START_FAILED_EVENT } from '@worker/constants/deprovisioning';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedTenantRequest,
  respond,
  respondError,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { deprovisionTenant } from '@worker/workflows/deprovision-tenant';
import { start } from 'workflow/api';

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedTenantRequest(request);
  if (!signed.ok) return signed.response;
  const { tenantId } = signed;

  try {
    const tenant = await getTenantById(tenantId, { includeArchived: true });
    if (!tenant) {
      return respondError(HTTP_STATUS.NOT_FOUND, ENQUEUE_ERROR.NOT_FOUND);
    }

    const run = await start(deprovisionTenant, [tenantId]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error(DEPROVISIONING_START_FAILED_EVENT, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
