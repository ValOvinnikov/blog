import { HTTP_STATUS } from '@blog/config/constants';
import { PREVIEW_LOG } from '@web/constants/preview';
import { verifyPreviewLink } from '@web/server/preview/preview-link/preview-link';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { privateRedirect } from '@web/utils/private-redirect';
import { draftMode } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

const TOKEN_PARAM = 'token';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = env.PREVIEW_LINK_SECRET;
  if (!secret) {
    logger.error(PREVIEW_LOG.SECRET_MISSING);
    return new NextResponse(null, {
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }

  const tenant = await resolveRequestTenant();
  if (!tenant) {
    return new NextResponse(null, { status: HTTP_STATUS.NOT_FOUND });
  }

  const check = verifyPreviewLink({
    token: request.nextUrl.searchParams.get(TOKEN_PARAM) ?? undefined,
    secret,
    tenantId: tenant.id,
  });
  if (!check.isValid) {
    logger.warn(PREVIEW_LOG.LINK_REFUSED, {
      tenantId: tenant.id,
      refusal: check.refusal,
    });
    return new NextResponse(null, { status: HTTP_STATUS.FORBIDDEN });
  }

  (await draftMode()).enable();
  return privateRedirect(new URL(check.path, request.nextUrl.origin));
}
