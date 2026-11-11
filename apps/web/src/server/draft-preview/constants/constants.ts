export const PREVIEW_TOKEN_QUERY_PARAM = 'preview';

export const PREVIEW_TOKEN_HEADER = 'x-preview-token';

/** Marks both the `[tenant]` segment and the route folder of a draft render; `~` never appears in a published slug. */
export const DRAFT_PREVIEW_MARKER = '~preview';

export const DRAFT_PREVIEW_MARKER_PATTERN = /(?:~|%7e)preview/i;
