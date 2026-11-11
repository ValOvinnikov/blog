import { PREVIEW_TOKEN_HEADER } from '@web/server/draft-preview/constants/constants';
import { readPreviewTokenClaims } from '@web/server/draft-preview/preview-token/preview-token';
import { headers } from 'next/headers';

/** Re-checks at render time what the proxy verified, so a request that bypassed the proxy never reaches a draft. */
export const hasDraftPreviewToken = async (
  tenantId: string,
): Promise<boolean> => {
  const token = (await headers()).get(PREVIEW_TOKEN_HEADER);
  return token ? readPreviewTokenClaims(token)?.tenantId === tenantId : false;
};
