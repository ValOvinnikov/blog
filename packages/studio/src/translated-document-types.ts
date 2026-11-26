import { PAGE_COOKIE_STATEMENT_TYPE } from '@shinefold/studio/schema-types/documents/pages/cookie-statement/cookie-statement-type';
import { PAGE_HOME_TYPE } from '@shinefold/studio/schema-types/documents/pages/home/home-type';
import { PAGE_LANDING_TYPE } from '@shinefold/studio/schema-types/documents/pages/landing/landing-type';
import { PAGE_LEGAL_DOCUMENT_TYPE } from '@shinefold/studio/schema-types/documents/pages/legal-document/legal-document-type';
import { PAGE_LEGAL_INDEX_TYPE } from '@shinefold/studio/schema-types/documents/pages/legal-index/legal-index-type';
import { PAGE_POST_TYPE } from '@shinefold/studio/schema-types/documents/pages/post/post-type';
import { PAGE_POST_INDEX_TYPE } from '@shinefold/studio/schema-types/documents/pages/post-index/post-index-type';
import { PAGE_PRIVACY_DOCUMENT_TYPE } from '@shinefold/studio/schema-types/documents/pages/privacy-document/privacy-document-type';
import { PAGE_PRIVACY_INDEX_TYPE } from '@shinefold/studio/schema-types/documents/pages/privacy-index/privacy-index-type';
import { PAGE_TAG_TYPE } from '@shinefold/studio/schema-types/documents/pages/tag/tag-type';
import { PAGE_TAG_INDEX_TYPE } from '@shinefold/studio/schema-types/documents/pages/tag-index/tag-index-type';
import { PAGE_TOPIC_TYPE } from '@shinefold/studio/schema-types/documents/pages/topic/topic-type';
import { PAGE_TOPIC_INDEX_TYPE } from '@shinefold/studio/schema-types/documents/pages/topic-index/topic-index-type';

const TRANSLATED_PAGES: { type: string; isOnePerLanguage: boolean }[] = [
  { type: PAGE_HOME_TYPE, isOnePerLanguage: true },
  { type: PAGE_LANDING_TYPE, isOnePerLanguage: false },
  { type: PAGE_POST_TYPE, isOnePerLanguage: false },
  { type: PAGE_POST_INDEX_TYPE, isOnePerLanguage: true },
  { type: PAGE_TOPIC_TYPE, isOnePerLanguage: false },
  { type: PAGE_TOPIC_INDEX_TYPE, isOnePerLanguage: true },
  { type: PAGE_TAG_TYPE, isOnePerLanguage: false },
  { type: PAGE_TAG_INDEX_TYPE, isOnePerLanguage: true },
  { type: PAGE_PRIVACY_INDEX_TYPE, isOnePerLanguage: true },
  { type: PAGE_PRIVACY_DOCUMENT_TYPE, isOnePerLanguage: false },
  { type: PAGE_LEGAL_INDEX_TYPE, isOnePerLanguage: true },
  { type: PAGE_LEGAL_DOCUMENT_TYPE, isOnePerLanguage: false },
  { type: PAGE_COOKIE_STATEMENT_TYPE, isOnePerLanguage: true },
];

export const TRANSLATED_DOCUMENT_TYPES: string[] = TRANSLATED_PAGES.map(
  ({ type }) => type,
);

export const ONE_PER_LANGUAGE_DOCUMENT_TYPES: string[] =
  TRANSLATED_PAGES.filter(({ isOnePerLanguage }) => isOnePerLanguage).map(
    ({ type }) => type,
  );
