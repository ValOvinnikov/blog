import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home/home';
import { landingPageSchema } from '@blog/studio/schema-types/documents/pages/landing/landing';
import { postPageSchema } from '@blog/studio/schema-types/documents/pages/post/post';
import { postIndexPageSchema } from '@blog/studio/schema-types/documents/pages/post-index/post-index';
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
      items: [{ schema: landingPageSchema, mode: 'byLanguage' }],
    },
    {
      title: 'Blog',
      items: [
        { schema: postIndexPageSchema, mode: 'onePerLanguage' },
        { schema: postPageSchema },
        { schema: topicIndexPageSchema, mode: 'onePerLanguage' },
        { schema: topicPageSchema, mode: 'byLanguage' },
        { schema: tagIndexPageSchema, mode: 'onePerLanguage' },
        { schema: tagPageSchema, mode: 'byLanguage' },
      ],
    },
  ],
};
