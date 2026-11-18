import { HTTP_STATUS } from '@shinefold/config/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import { revokeMemberAccess } from '@worker/units/revoke-member-access';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  respond,
  respondError,
  tenantRequestBodySchema,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { z } from 'zod';

const revokeRequestBodySchema = tenantRequestBodySchema.extend({
  memberEmail: z.string().trim().pipe(z.email()),
  sanityUserId: z.string().trim().min(1).optional(),
});

export async function POST(request: Request): Promise<Response> {
  const signed = await readSignedRequest(
    request,
    revokeRequestBodySchema,
    env.WORKER_ENQUEUE_SECRET,
  );
  if (!signed.ok) return signed.error;
  const { tenantId, memberEmail, sanityUserId } = signed.data;

  try {
    if (!(await getTenantById(tenantId, { includeArchived: true }))) {
      return respondError(HTTP_STATUS.NOT_FOUND, ENQUEUE_ERROR.NOT_FOUND);
    }
    await revokeMemberAccess(tenantId, { email: memberEmail, sanityUserId });
    return respond(HTTP_STATUS.ACCEPTED, {});
  } catch (error) {
    logger.error(MEMBER_ACCESS_LOG.REVOKE_FAILED, {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
