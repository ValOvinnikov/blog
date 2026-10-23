import { MOCK_TENANT_PROJECT_ID } from '@blog/service/testing/tenant';

const TENANT_TAG_PREFIX = `t:${MOCK_TENANT_PROJECT_ID}:`;

export function mockCacheTag(tag: string) {
  return `${TENANT_TAG_PREFIX}${tag}`;
}

export const MOCK_AUTHOR_CACHE_TAG = `${TENANT_TAG_PREFIX}author`;
export const MOCK_BLOCK_FAQ_CACHE_TAG = `${TENANT_TAG_PREFIX}block_faq`;
export const MOCK_HOME_PAGE_CACHE_TAG = `${TENANT_TAG_PREFIX}homePage`;
export const MOCK_LINK_CACHE_TAG = `${TENANT_TAG_PREFIX}link`;
export const MOCK_MODULES_FAQ_CACHE_TAG = `${TENANT_TAG_PREFIX}modules:faq`;
export const MOCK_MODULES_POST_LIST_CACHE_TAG = `${TENANT_TAG_PREFIX}modules:postList`;
export const MOCK_MODULES_TAXONOMY_LIST_CACHE_TAG = `${TENANT_TAG_PREFIX}modules:taxonomyList`;
export const MOCK_PAGE_LANDING_CACHE_TAG = `${TENANT_TAG_PREFIX}page_landing`;
export const MOCK_PAGE_POST_CACHE_TAG = `${TENANT_TAG_PREFIX}page_post`;
export const MOCK_PAGE_POST_INDEX_CACHE_TAG = `${TENANT_TAG_PREFIX}page_postIndex`;
export const MOCK_PAGE_TAG_CACHE_TAG = `${TENANT_TAG_PREFIX}page_tag`;
export const MOCK_PAGE_TAG_INDEX_CACHE_TAG = `${TENANT_TAG_PREFIX}page_tagIndex`;
export const MOCK_PAGE_TOPIC_CACHE_TAG = `${TENANT_TAG_PREFIX}page_topic`;
export const MOCK_PAGE_TOPIC_INDEX_CACHE_TAG = `${TENANT_TAG_PREFIX}page_topicIndex`;
export const MOCK_POSTS_CACHE_TAG = `${TENANT_TAG_PREFIX}posts`;
export const MOCK_TAG_CACHE_TAG = `${TENANT_TAG_PREFIX}tag`;
export const MOCK_TAGS_CACHE_TAG = `${TENANT_TAG_PREFIX}tags`;
export const MOCK_TEMPLATE_POST_INDEX_CACHE_TAG = `${TENANT_TAG_PREFIX}template_postIndex`;
export const MOCK_TEMPLATE_TAG_CACHE_TAG = `${TENANT_TAG_PREFIX}template_tag`;
export const MOCK_TEMPLATE_TOPIC_CACHE_TAG = `${TENANT_TAG_PREFIX}template_topic`;
export const MOCK_TOPIC_CACHE_TAG = `${TENANT_TAG_PREFIX}topic`;
export const MOCK_TOPICS_CACHE_TAG = `${TENANT_TAG_PREFIX}topics`;
export const MOCK_TEMPLATE_HOME_CACHE_TAG = `${TENANT_TAG_PREFIX}template_home`;
export const MOCK_TEMPLATE_LANDING_CACHE_TAG = `${TENANT_TAG_PREFIX}template_landing`;
export const MOCK_TEMPLATE_TAG_INDEX_CACHE_TAG = `${TENANT_TAG_PREFIX}template_tagIndex`;
export const MOCK_TEMPLATE_TOPIC_INDEX_CACHE_TAG = `${TENANT_TAG_PREFIX}template_topicIndex`;
