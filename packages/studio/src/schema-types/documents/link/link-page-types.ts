import { PAGE_COOKIE_STATEMENT_TYPE } from '@blog/studio/schema-types/documents/pages/cookie-statement/cookie-statement-type';
import { PAGE_HOME_TYPE } from '@blog/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_LEGAL_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/legal-document/legal-document-type';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/post-index/post-index-type';
import { PAGE_PRIVACY_DOCUMENT_TYPE } from '@blog/studio/schema-types/documents/pages/privacy-document/privacy-document-type';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TAG_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { PAGE_TOPIC_INDEX_TYPE } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index-type';

export const LINK_PAGE_TYPES = [
  PAGE_HOME_TYPE,
  PAGE_LANDING_TYPE,
  PAGE_POST_TYPE,
  PAGE_POST_INDEX_TYPE,
  PAGE_TOPIC_TYPE,
  PAGE_TOPIC_INDEX_TYPE,
  PAGE_TAG_TYPE,
  PAGE_TAG_INDEX_TYPE,
  PAGE_PRIVACY_DOCUMENT_TYPE,
  PAGE_LEGAL_DOCUMENT_TYPE,
  PAGE_COOKIE_STATEMENT_TYPE,
] as const;
