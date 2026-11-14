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
  LIVE_LOCALES_LOOKUP_FAILED: 'revalidate.live_locales_lookup_failed',
  TENANT_PAGE_LIST_LOOKUP_FAILED: 'revalidate.tenant_page_list_lookup_failed',
  BLOG_PAGINATION_LOOKUP_FAILED: 'revalidate.blog_pagination_lookup_failed',
  TAG_PARAMS_LOOKUP_FAILED: 'revalidate.tag_params_lookup_failed',
  TAG_PAGINATION_LOOKUP_FAILED: 'revalidate.tag_pagination_lookup_failed',
  TOPIC_PARAMS_LOOKUP_FAILED: 'revalidate.topic_params_lookup_failed',
  TOPIC_PAGINATION_LOOKUP_FAILED: 'revalidate.topic_pagination_lookup_failed',
  BOOKMARK_CLEANUP_FAILED: 'revalidate.bookmark_cleanup_failed',
  FIRST_POST_STAMP_FAILED: 'revalidate.first_post_stamp_failed',
  NEWSLETTER_SEND_START_FAILED: 'revalidate.newsletter_send_start_failed',
  NEWSLETTER_SEND_ENQUEUE_SKIPPED: 'revalidate.newsletter_send_enqueue_skipped',
  NEWSLETTER_SEND_ENQUEUE_REFUSED: 'revalidate.newsletter_send_enqueue_refused',
  NEWSLETTER_SEND_ENQUEUE_FAILED: 'revalidate.newsletter_send_enqueue_failed',
  NEWSLETTER_SEND_RELEASE_FAILED: 'revalidate.newsletter_send_release_failed',
} as const;

export const WHOLE_SITE_PURGE_ARGS = ['/', 'layout'] as const;

export const TENANT_LOOKUP_FAILED_MESSAGE = 'Tenant lookup failed.';

export const DOCUMENT_NOT_FOUND_REASON = 'document_not_found';

export const FETCH_FAILED_REASON = 'fetch_failed';

export const TENANT_UNRESOLVED_REASON = 'tenant_unresolved';

export const REVALIDATE_SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000;

export const SIGNATURE_REFUSED_REASON = 'signature_refused';

export const STARTER_DOCUMENT_ID_PREFIX = 'starter.';
