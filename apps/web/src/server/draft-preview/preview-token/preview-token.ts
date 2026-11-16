import type { TMaybeUndefined } from '@shinefold/config';
import {
  type IPreviewTokenClaims,
  readPreviewTokenClaims,
} from '@shinefold/utils/preview-token';
import { env } from '@web/utils/env/env';

export const readPreviewLinkClaims = (
  token: string,
): TMaybeUndefined<IPreviewTokenClaims> => {
  const secret = env.PREVIEW_LINK_SECRET;
  return secret ? readPreviewTokenClaims(token, secret) : undefined;
};
