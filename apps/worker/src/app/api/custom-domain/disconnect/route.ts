import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { CUSTOM_DOMAIN_LOG } from '@worker/constants/custom-domain';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { customDomainRequestBodySchema } from '@worker/utils/custom-domain-request/custom-domain-request';
import { getDisconnectRefusal } from '@worker/utils/disconnect-guard/disconnect-guard';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  respond,
  respondError,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { disconnectCustomDomain } from '@worker/workflows/disconnect-custom-domain';
import { start } from 'workflow/api';

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedRequest(
    request,
    customDomainRequestBodySchema,
  );
  if (!signed.ok) return signed.error;
  const { tenantId, domain } = signed.data;

  try {
    if (!(await getTenantById(tenantId, { includeArchived: true }))) {
      return respondError(HTTP_STATUS.NOT_FOUND, ENQUEUE_ERROR.NOT_FOUND);
    }
    const refusal = await getDisconnectRefusal(domain);
    if (refusal) return respondError(HTTP_STATUS.CONFLICT, refusal);

    const run = await start(disconnectCustomDomain, [tenantId, domain]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error(CUSTOM_DOMAIN_LOG.DISCONNECT_START_FAILED, {
      tenantId,
      domain,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
