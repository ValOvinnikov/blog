import type { TValueOf } from '@blog/config/utils';

export const PREVIEW_LOG = {
  SECRET_MISSING: 'preview.secret_missing',
  LINK_REFUSED: 'preview.link_refused',
} as const;

export const PREVIEW_LINK_REFUSAL = {
  MALFORMED: 'MALFORMED',
  EXPIRED: 'EXPIRED',
  OTHER_TENANT: 'OTHER_TENANT',
  OUTSIDE_SITE: 'OUTSIDE_SITE',
} as const;

export type TPreviewLinkRefusal = TValueOf<typeof PREVIEW_LINK_REFUSAL>;
