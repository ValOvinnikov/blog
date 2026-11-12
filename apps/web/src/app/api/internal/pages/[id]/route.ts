import { HTTP_STATUS, LOCALE_ISO_CODES } from '@blog/config/constants';
import { service } from '@blog/service';
import { isUndefined } from '@blog/utils/primitives';
import { INTERNAL_PAGES_LOG } from '@web/constants/internal-pages';
import {
  respondToInternalPageRequest,
  type TInternalPageRouteContext,
} from '@web/server/internal-pages/respond-to-internal-page-request/respond-to-internal-page-request';
import { respondEmpty } from '@web/utils/empty-response/empty-response';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestBodySchema = z.object({
  tenantId: z.uuid(),
  locale: z.enum(LOCALE_ISO_CODES),
});

export async function POST(
  request: Request,
  context: TInternalPageRouteContext,
): Promise<NextResponse> {
  return respondToInternalPageRequest(
    request,
    context,
    requestBodySchema,
    async ({ id, body: { tenantId, locale }, tenant }) => {
      const result = await service.pages.pageTitle.v1.getPageTitle(id, {
        ...tenant,
        locale,
      });
      if (!result.ok) {
        logger.error(INTERNAL_PAGES_LOG.TITLE_FETCH_FAILED, {
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
    },
  );
}
