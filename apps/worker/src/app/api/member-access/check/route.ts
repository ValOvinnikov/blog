import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import { handleMemberAccessRequest } from '@worker/utils/member-access-run/handle-member-access-request';

export function POST(request: Request): Promise<Response> {
  return handleMemberAccessRequest(request, {
    failureEvent: MEMBER_ACCESS_LOG.CHECK_NOW_FAILED,
  });
}
