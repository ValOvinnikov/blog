import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedTenantRequest,
  respond,
  respondError,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';

import { wakeOwnerAccess } from './owner-access-run';

export async function handleOwnerAccessRequest(
  request: Request,
  input: { failureEvent: string; before?: (tenantId: string) => Promise<void> },
): Promise<Response> {
  const signed = await readSignedTenantRequest(request);
  if (!signed.ok) return signed.error;
  const { data: tenantId } = signed;

  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return respondError(HTTP_STATUS.NOT_FOUND, ENQUEUE_ERROR.NOT_FOUND);
    }
    if (!tenant.sanityProjectId) {
      return respondError(HTTP_STATUS.CONFLICT, ENQUEUE_ERROR.NOT_PROVISIONED);
    }

    await input.before?.(tenantId);
    await wakeOwnerAccess(tenantId);
    return respond(HTTP_STATUS.ACCEPTED, {});
  } catch (error) {
    logger.error(input.failureEvent, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
