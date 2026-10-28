import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantByDomain } from '@blog/db/queries/tenant-domains/get-tenant-by-domain';
import { getTenantById } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { CUSTOM_DOMAIN_LOG } from '@worker/constants/custom-domain';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { customDomainRequestBodySchema } from '@worker/utils/custom-domain-request/custom-domain-request';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  respond,
  respondError,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { connectCustomDomain } from '@worker/workflows/connect-custom-domain';
import { start } from 'workflow/api';

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedRequest(
    request,
    customDomainRequestBodySchema,
  );
  if (!signed.ok) return signed.error;
  const { tenantId, domain } = signed.data;

  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return respondError(HTTP_STATUS.NOT_FOUND, ENQUEUE_ERROR.NOT_FOUND);
    }
    if (!tenant.sanityProjectId) {
      return respondError(HTTP_STATUS.CONFLICT, ENQUEUE_ERROR.NOT_PROVISIONED);
    }
    if ((await getTenantByDomain(domain))?.id !== tenantId) {
      return respondError(
        HTTP_STATUS.CONFLICT,
        ENQUEUE_ERROR.DOMAIN_NOT_ASSIGNED,
      );
    }

    const run = await start(connectCustomDomain, [tenantId, domain]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error(CUSTOM_DOMAIN_LOG.CONNECT_START_FAILED, {
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
