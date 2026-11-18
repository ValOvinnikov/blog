import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { handleAccessRequest } from '@worker/utils/access-run/handle-access-request';
import { ownerAccessRequest } from '@worker/utils/owner-access-run/owner-access-request';

export function POST(request: Request): Promise<Response> {
  return handleAccessRequest(request, {
    ...ownerAccessRequest,
    failureEvent: OWNER_ACCESS_LOG.CHECK_NOW_FAILED,
  });
}
