import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home/home';
import { landingPageSchema } from '@blog/studio/schema-types/documents/pages/landing/landing';
import { legalDocumentPageSchema } from '@blog/studio/schema-types/documents/pages/legal-document/legal-document';
import { postPageSchema } from '@blog/studio/schema-types/documents/pages/post/post';
import { postIndexPageSchema } from '@blog/studio/schema-types/documents/pages/post-index/post-index';
import { privacyDocumentPageSchema } from '@blog/studio/schema-types/documents/pages/privacy-document/privacy-document';
import { tagPageSchema } from '@blog/studio/schema-types/documents/pages/tag/tag';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index';
import { topicPageSchema } from '@blog/studio/schema-types/documents/pages/topic/topic';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
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
      items: [{ schema: privacyDocumentPageSchema, mode: 'byLanguage' }],
    },
    {
      title: 'Legal',
      items: [{ schema: legalDocumentPageSchema, mode: 'byLanguage' }],
    },
  ],
};
