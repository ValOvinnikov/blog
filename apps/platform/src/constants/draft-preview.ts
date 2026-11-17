import type { TValueOf } from '@shinefold/config/utils';

export const DRAFT_PREVIEW_REFUSAL = {
  NOT_FOUND: 'NOT_FOUND',
  LANGUAGE_OFF: 'LANGUAGE_OFF',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type TDraftPreviewRefusal = TValueOf<typeof DRAFT_PREVIEW_REFUSAL>;

export const DRAFT_PREVIEW_LOG = {
  SECRET_MISSING: 'draft_preview.secret_missing',
  PATH_SKIPPED: 'draft_preview.path_skipped',
  PATH_FAILED: 'draft_preview.path_failed',
  PATH_ERROR: 'draft_preview.path_error',
} as const;

export const PREVIEW_TOKEN_QUERY_PARAM = 'preview';
