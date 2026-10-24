import {
  HTTP_STATUS,
  LOCALE_ISO_CODES,
  type THttpStatus,
} from '@blog/config/constants';
import { queries } from '@blog/db';
import { service } from '@blog/service';
import { isUndefined } from '@blog/utils/primitives';
import {
  INTERNAL_PAGES_SECRET_MISSING_EVENT,
  INTERNAL_PAGES_TITLE_FETCH_FAILED_EVENT,
} from '@web/constants/internal-pages';
import { readSignedRequestBody } from '@web/server/signed-request/read-signed-request-body/read-signed-request-body';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestBodySchema = z.object({
  tenantId: z.uuid(),
  locale: z.enum(LOCALE_ISO_CODES),
});

type TProps = { params: Promise<{ id: string }> };

const respondEmpty = (status: THttpStatus): NextResponse =>
  new NextResponse(null, { status });

const parseRequestBody = (rawBody: string) => {
  try {
    return requestBodySchema.safeParse(JSON.parse(rawBody));
  } catch {
    return undefined;
  }
};

export async function POST(
  request: Request,
  { params }: TProps,
): Promise<NextResponse> {
  const secret = env.INTERNAL_PAGES_SECRET;
  if (!secret) {
    logger.error(INTERNAL_PAGES_SECRET_MISSING_EVENT);
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  const rawBody = await readSignedRequestBody(request, secret);
  if (isUndefined(rawBody)) {
    return respondEmpty(HTTP_STATUS.UNAUTHORIZED);
  }

  const parsedBody = parseRequestBody(rawBody);
  if (!parsedBody?.success) {
    return respondEmpty(HTTP_STATUS.BAD_REQUEST);
  }
  const { tenantId, locale } = parsedBody.data;
  const { id } = await params;

  let tenant;
  try {
    tenant = await queries.tenants.getTenantSanityCredentials(tenantId);
  } catch (error) {
    logger.error('internal_pages.tenant_lookup_failed', { tenantId, error });
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  if (!tenant) {
    return respondEmpty(HTTP_STATUS.NOT_FOUND);
  }

  const result = await service.pages.pageTitle.v1.getPageTitle(id, {
    ...tenant,
    locale,
  });
  if (!result.ok) {
    logger.error(INTERNAL_PAGES_TITLE_FETCH_FAILED_EVENT, {
      tenantId,
      id,
      locale,
      error: result.error,
    });
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  if (isUndefined(result.data)) {
    return respondEmpty(HTTP_STATUS.NOT_FOUND);
  }

  return NextResponse.json({ title: result.data });
}
