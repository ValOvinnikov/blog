import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import { handleAccessRequest } from '@worker/utils/access-run/handle-access-request';
import { memberAccessRequest } from '@worker/utils/member-access-run/member-access-request';

export function POST(request: Request): Promise<Response> {
  return handleAccessRequest(request, {
    ...memberAccessRequest,
    failureEvent: MEMBER_ACCESS_LOG.CHECK_NOW_FAILED,
  });
}
