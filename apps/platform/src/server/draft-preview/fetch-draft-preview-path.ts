import 'server-only';

import {
  DRAFT_PREVIEW_LOG,
  DRAFT_PREVIEW_REFUSAL,
  type TDraftPreviewRefusal,
} from '@platform/constants/draft-preview';
import {
  internalPagesRoutes,
  postToInternalPagesRoute,
} from '@platform/server/internal-pages/post-to-internal-pages-route';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { HTTP_STATUS } from '@shinefold/config';
import { z } from 'zod';

const draftPathResponseSchema = z.object({ path: z.string().startsWith('/') });

// Sanity's id alphabet; refusing `.` and `..` keeps `new URL` from resolving them into another route.
const documentIdSchema = z
  .string()
  .max(128)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/);

export type TDraftPreviewPath =
  | { isResolved: true; path: string }
  | { isResolved: false; refusal: TDraftPreviewRefusal };

const refuse = (refusal: TDraftPreviewRefusal): TDraftPreviewPath => ({
  isResolved: false,
  refusal,
});

export const fetchDraftPreviewPath = async (
  tenantId: string,
  documentId: string,
): Promise<TDraftPreviewPath> => {
  if (!documentIdSchema.safeParse(documentId).success) {
    return refuse(DRAFT_PREVIEW_REFUSAL.NOT_FOUND);
  }

  try {
    const result = await postToInternalPagesRoute(
      internalPagesRoutes.path(documentId),
      { tenantId },
    );

    if (!result.isConfigured) {
      const { hasWebAppUrl, hasSecret } = result;
      logger.error(DRAFT_PREVIEW_LOG.PATH_SKIPPED, { hasWebAppUrl, hasSecret });
      return refuse(DRAFT_PREVIEW_REFUSAL.UNAVAILABLE);
    }

    const { response } = result;
    if (response.status === HTTP_STATUS.NOT_FOUND) {
      return refuse(DRAFT_PREVIEW_REFUSAL.NOT_FOUND);
    }
    if (response.status === HTTP_STATUS.CONFLICT) {
      return refuse(DRAFT_PREVIEW_REFUSAL.LANGUAGE_OFF);
    }

    const parsed = response.ok
      ? draftPathResponseSchema.safeParse(await response.json())
      : undefined;
    if (!parsed?.success) {
      logger.error(DRAFT_PREVIEW_LOG.PATH_FAILED, {
        tenantId,
        documentId,
        responseStatus: response.status,
      });
      return refuse(DRAFT_PREVIEW_REFUSAL.UNAVAILABLE);
    }

    return { isResolved: true, path: parsed.data.path };
  } catch (error) {
    logger.error(DRAFT_PREVIEW_LOG.PATH_ERROR, {
      tenantId,
      documentId,
      ...toLoggableError(error),
    });
    return refuse(DRAFT_PREVIEW_REFUSAL.UNAVAILABLE);
  }
};
