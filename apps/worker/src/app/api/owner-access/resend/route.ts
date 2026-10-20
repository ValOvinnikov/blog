import { resendOwnerInvite } from '@worker/units/resend-owner-invite';
import { handleOwnerAccessRequest } from '@worker/utils/owner-access-run/handle-owner-access-request';

export function POST(request: Request): Promise<Response> {
  return handleOwnerAccessRequest(request, {
    failureEvent: 'owner_access.resend_failed',
    before: resendOwnerInvite,
  });
}
