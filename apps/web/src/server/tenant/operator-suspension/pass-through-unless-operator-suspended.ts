import { HTTP_STATUS } from '@blog/config';
import { PROXY_LOG } from '@web/constants/proxy';
import { TENANT_ID_HEADER } from '@web/server/tenant/constants/constants';
import { isOperatorSuspended } from '@web/server/tenant/operator-suspension/operator-suspension';
import { resolveTenant } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { logger } from '@web/utils/logger/logger';
import { siteUnavailableStatus } from '@web/utils/site-unavailable-response';
import { NextResponse, type NextRequest } from 'next/server';

/** For the sitemap and the site's API routes, which resolve their own tenant and never see the `[tenant]` rewrite. */
export const passThroughUnlessOperatorSuspended = async (
  request: NextRequest,
): Promise<NextResponse> => {
  request.headers.delete(TENANT_ID_HEADER);
  const host = request.headers.get('host');

  try {
    const tenant = await resolveTenant(host);
    if (tenant && isOperatorSuspended(tenant)) return siteUnavailableStatus();
  } catch (error) {
    logger.error(PROXY_LOG.TENANT_LOOKUP_FAILED, { host, error });
    return new NextResponse(null, { status: HTTP_STATUS.SERVICE_UNAVAILABLE });
  }

  return NextResponse.next({ request: { headers: request.headers } });
};
