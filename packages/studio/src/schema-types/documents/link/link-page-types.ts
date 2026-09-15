import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TAG_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { PAGE_TOPIC_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index-type';

/**
 * Every page document `_type` — the full, single-edit-to-extend set of
 * valid `internalReference` targets for the `link` document.
 */
export const LINK_PAGE_TYPES = [
  PAGE_HOME_TYPE,
  PAGE_LANDING_TYPE,
  PAGE_POST_TYPE,
  PAGE_POST_INDEX_TYPE,
  PAGE_TOPIC_TYPE,
  PAGE_TOPIC_INDEX_TYPE,
  PAGE_TAG_TYPE,
  PAGE_TAG_INDEX_TYPE,
] as const;
