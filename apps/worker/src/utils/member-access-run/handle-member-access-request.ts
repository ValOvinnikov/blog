import { HTTP_STATUS } from '@shinefold/config/constants';
import { getMemberStudioAccess } from '@shinefold/db/queries/memberships';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  respond,
  respondError,
  tenantRequestBodySchema,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import { z } from 'zod';

import { wakeMemberAccess } from './member-access-run';

const memberAccessRequestBodySchema = tenantRequestBodySchema.extend({
  membershipId: z.uuid(),
});

export async function handleMemberAccessRequest(
  request: Request,
  input: {
    failureEvent: string;
    before?: (tenantId: string, membershipId: string) => Promise<void>;
  },
): Promise<Response> {
  const signed = await readSignedRequest(
    request,
    memberAccessRequestBodySchema,
    env.WORKER_ENQUEUE_SECRET,
  );
  if (!signed.ok) return signed.error;
  const { tenantId, membershipId } = signed.data;

  try {
    const tenant = await getTenantById(tenantId);
    if (!tenant || !(await getMemberStudioAccess(tenantId, membershipId))) {
      return respondError(HTTP_STATUS.NOT_FOUND, ENQUEUE_ERROR.NOT_FOUND);
    }
    if (!tenant.sanityProjectId) {
      return respondError(HTTP_STATUS.CONFLICT, ENQUEUE_ERROR.NOT_PROVISIONED);
    }

    await input.before?.(tenantId, membershipId);
    await wakeMemberAccess(tenantId, membershipId);
    return respond(HTTP_STATUS.ACCEPTED, {});
  } catch (error) {
    logger.error(input.failureEvent, {
      tenantId,
      membershipId,
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
