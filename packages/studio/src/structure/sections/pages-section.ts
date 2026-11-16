import { cookieStatementPageSchema } from '@shinefold/studio/schema-types/documents/pages/cookie-statement/cookie-statement';
import { homePageSchema } from '@shinefold/studio/schema-types/documents/pages/home/home';
import { landingPageSchema } from '@shinefold/studio/schema-types/documents/pages/landing/landing';
import { legalDocumentPageSchema } from '@shinefold/studio/schema-types/documents/pages/legal-document/legal-document';
import { legalIndexPageSchema } from '@shinefold/studio/schema-types/documents/pages/legal-index/legal-index';
import { postPageSchema } from '@shinefold/studio/schema-types/documents/pages/post/post';
import { postIndexPageSchema } from '@shinefold/studio/schema-types/documents/pages/post-index/post-index';
import { privacyDocumentPageSchema } from '@shinefold/studio/schema-types/documents/pages/privacy-document/privacy-document';
import { privacyIndexPageSchema } from '@shinefold/studio/schema-types/documents/pages/privacy-index/privacy-index';
import { tagPageSchema } from '@shinefold/studio/schema-types/documents/pages/tag/tag';
import { tagIndexPageSchema } from '@shinefold/studio/schema-types/documents/pages/tag-index/tag-index';
import { topicPageSchema } from '@shinefold/studio/schema-types/documents/pages/topic/topic';
import { topicIndexPageSchema } from '@shinefold/studio/schema-types/documents/pages/topic-index/topic-index';
import type { TStructureSection } from '@shinefold/studio/structure/build-section/build-section';
import { Files } from 'lucide-react';

export const pagesSection: TStructureSection = {
  title: 'Pages',
  id: 'pages',
  icon: Files,
  groups: [
    {
      title: 'Home',
      items: [{ schema: homePageSchema, mode: 'onePerLanguage' }],
    },
    {
      title: 'Landing',
      items: [{ schema: landingPageSchema, mode: 'pageTree' }],
    },
    {
      title: 'Blog',
      items: [
        { schema: postIndexPageSchema, mode: 'onePerLanguage' },
        { schema: postPageSchema, mode: 'byLanguage' },
        { schema: topicIndexPageSchema, mode: 'onePerLanguage' },
        { schema: topicPageSchema, mode: 'byLanguage' },
        { schema: tagIndexPageSchema, mode: 'onePerLanguage' },
        { schema: tagPageSchema, mode: 'byLanguage' },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { schema: privacyIndexPageSchema, mode: 'onePerLanguage' },
        { schema: privacyDocumentPageSchema, mode: 'byLanguage' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { schema: legalIndexPageSchema, mode: 'onePerLanguage' },
        { schema: legalDocumentPageSchema, mode: 'byLanguage' },
        { schema: cookieStatementPageSchema, mode: 'onePerLanguage' },
      ],
    },
  ],
};
