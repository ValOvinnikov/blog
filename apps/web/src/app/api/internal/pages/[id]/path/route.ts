import { HTTP_STATUS } from '@blog/config/constants';
import { service } from '@blog/service';
import { isUndefined } from '@blog/utils/primitives';
import { INTERNAL_PAGES_LOG } from '@web/constants/internal-pages';
import {
  respondToInternalPageRequest,
  type TInternalPageRouteContext,
} from '@web/server/internal-pages/respond-to-internal-page-request/respond-to-internal-page-request';
import { toDraftPreviewPath } from '@web/server/internal-pages/to-draft-preview-path/to-draft-preview-path';
import { respondEmpty } from '@web/utils/empty-response/empty-response';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestBodySchema = z.object({ tenantId: z.uuid() });

export async function POST(
  request: Request,
  context: TInternalPageRouteContext,
): Promise<NextResponse> {
  return respondToInternalPageRequest(
    request,
    context,
    requestBodySchema,
    async ({ id, body: { tenantId }, tenant }) => {
      const result = await service.pages.pagePath.v1.getDraftPagePath(
        id,
        tenant,
      );
      if (!result.ok) {
        logger.error(INTERNAL_PAGES_LOG.PATH_FETCH_FAILED, {
          tenantId,
          id,
          error: result.error,
        });
        return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
      if (isUndefined(result.data)) {
        return respondEmpty(HTTP_STATUS.NOT_FOUND);
      }

      return NextResponse.json({
        path: toDraftPreviewPath(result.data, tenant.defaultLocale),
      });
    },
  );
}
