import 'server-only';

import {
  DRAFT_PREVIEW_LOG,
  DRAFT_PREVIEW_REFUSAL,
  PREVIEW_TOKEN_QUERY_PARAM,
  type TDraftPreviewRefusal,
} from '@platform/constants/draft-preview';
import { logger } from '@platform/utils/logger/logger';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { webSecretsEnv } from '@platform/utils/web-secrets-env/web-secrets-env';
import { TENANT_STATUS } from '@shinefold/db/constants';
import { signPreviewToken } from '@shinefold/utils/preview-token';

import { fetchDraftPreviewPath } from './fetch-draft-preview-path';

// Long enough for the frame to load, short enough that a copied frame address is useless soon after.
export const DRAFT_PREVIEW_TOKEN_TTL_MS = 5 * 60_000;

export type TDraftPreview =
  | {
      isReady: true;
      frameUrl: string;
      publishedUrl: string;
      siteUrl: string;
      path: string;
    }
  | { isReady: false; refusal: TDraftPreviewRefusal };

const refuse = (refusal: TDraftPreviewRefusal): TDraftPreview => ({
  isReady: false,
  refusal,
});

export const resolveDraftPreview = async (
  tenant: TPlatformTenant,
  documentId: string,
  now: number = Date.now(),
): Promise<TDraftPreview> => {
  const { id: tenantId, status, isArchived, siteUrl } = tenant;

  if (isArchived || status === TENANT_STATUS.ARCHIVED) {
    return refuse(DRAFT_PREVIEW_REFUSAL.ARCHIVED);
  }
  if (status === TENANT_STATUS.SUSPENDED) {
    return refuse(DRAFT_PREVIEW_REFUSAL.SUSPENDED);
  }

  const secret = webSecretsEnv.PREVIEW_LINK_SECRET;
  if (!secret) {
    logger.error(DRAFT_PREVIEW_LOG.SECRET_MISSING, { tenantId });
    return refuse(DRAFT_PREVIEW_REFUSAL.UNAVAILABLE);
  }

  const draftPath = await fetchDraftPreviewPath(tenantId, documentId);
  if (!draftPath.isResolved) return refuse(draftPath.refusal);

  const { path } = draftPath;
  const token = signPreviewToken(
    { tenantId, path, expiresAt: now + DRAFT_PREVIEW_TOKEN_TTL_MS },
    secret,
  );
  const publishedUrl = `${siteUrl}${path}`;
  const query = new URLSearchParams({ [PREVIEW_TOKEN_QUERY_PARAM]: token });

  return {
    isReady: true,
    frameUrl: `${publishedUrl}?${query}`,
    publishedUrl,
    siteUrl,
    path,
  };
};
