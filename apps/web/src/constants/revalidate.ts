export const REVALIDATE_LOG = {
  SECRET_MISSING: 'revalidate.secret_missing',
  TENANT_ID_LOOKUP_FAILED: 'revalidate.tenant_id_lookup_failed',
  TENANT_BY_ID_LOOKUP_FAILED: 'revalidate.tenant_by_id_lookup_failed',
  TENANT_ARCHIVED: 'revalidate.tenant_archived',
  TENANT_SANITY_CREDENTIALS_MISSING:
    'revalidate.tenant_sanity_credentials_missing',
  TENANT_SANITY_CREDENTIALS_FETCH_THREW:
    'revalidate.tenant_sanity_credentials_fetch_threw',
  TENANT_ACTIVITY_TOUCH_FAILED: 'revalidate.tenant_activity_touch_failed',
  PATH_PURGE_FALLBACK: 'revalidate.path_purge_fallback',
  REFERENCING_MODULES_LOOKUP_FAILED:
    'revalidate.referencing_modules_lookup_failed',
  POST_LOOKUP_FAILED: 'revalidate.post_lookup_failed',
  BLOG_PAGINATION_LOOKUP_FAILED: 'revalidate.blog_pagination_lookup_failed',
  TAG_PARAMS_LOOKUP_FAILED: 'revalidate.tag_params_lookup_failed',
  TAG_PAGINATION_LOOKUP_FAILED: 'revalidate.tag_pagination_lookup_failed',
  TOPIC_PARAMS_LOOKUP_FAILED: 'revalidate.topic_params_lookup_failed',
  TOPIC_PAGINATION_LOOKUP_FAILED: 'revalidate.topic_pagination_lookup_failed',
  BOOKMARK_CLEANUP_FAILED: 'revalidate.bookmark_cleanup_failed',
} as const;

export const TENANT_LOOKUP_FAILED_MESSAGE = 'Tenant lookup failed.';

export const UNSUPPORTED_TYPE_REASON = 'unsupported_type';

export const DOCUMENT_NOT_FOUND_REASON = 'document_not_found';

export const FETCH_FAILED_REASON = 'fetch_failed';

export const TENANT_UNRESOLVED_REASON = 'tenant_unresolved';

export const REVALIDATE_SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

export const SIGNATURE_REFUSED_REASON = 'signature_refused';
