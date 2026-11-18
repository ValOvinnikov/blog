import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { resendOwnerInvite } from '@worker/units/resend-owner-invite';
import { handleAccessRequest } from '@worker/utils/access-run/handle-access-request';
import { ownerAccessRequest } from '@worker/utils/owner-access-run/owner-access-request';

export function POST(request: Request): Promise<Response> {
  return handleAccessRequest(request, {
    ...ownerAccessRequest,
    failureEvent: OWNER_ACCESS_LOG.RESEND_FAILED,
    before: ({ tenantId, formerOwnerEmail }) =>
      resendOwnerInvite(tenantId, formerOwnerEmail),
  });
}
