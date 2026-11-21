export const REQUEST_LOG = {
  UNHANDLED_ERROR: 'request.unhandled_error',
} as const;

export const REQUEST_HEADER = {
  ORIGIN: 'origin',
  SEC_FETCH_SITE: 'sec-fetch-site',
  CONTENT_TYPE: 'content-type',
} as const;

export const FETCH_SITE = {
  SAME_ORIGIN: 'same-origin',
} as const;

export const MEDIA_TYPE = {
  JSON: 'application/json',
} as const;
