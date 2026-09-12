import { authorSchema } from '@blog/studio/schema-types/documents/blog/author/author';
import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { blogPageSchema } from '@blog/studio/schema-types/documents/pages/blog/blog';
import { postPageSchema } from '@blog/studio/schema-types/documents/pages/post/post';
import { tagPageSchema } from '@blog/studio/schema-types/documents/pages/tag/tag';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index/tag-index';
import { topicPageSchema } from '@blog/studio/schema-types/documents/pages/topic/topic';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index/topic-index';
import { newsletterSettingsSchema } from '@blog/studio/schema-types/documents/settings/newsletter/newsletter';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Newspaper } from 'lucide-react';

export const blogSection: TStructureSection = {
  title: 'Blog',
  id: 'blog',
  icon: Newspaper,
  groups: [
    {
      title: 'Pages',
      items: [
        { schema: blogPageSchema, mode: 'singleton' },
        { schema: postPageSchema },
        { schema: topicIndexPageSchema, mode: 'singleton' },
        { schema: topicPageSchema },
        { schema: tagIndexPageSchema, mode: 'singleton' },
        { schema: tagPageSchema },
      ],
    },
    {
      title: 'Taxonomy',
      items: [{ schema: topicSchema }, { schema: tagSchema }],
    },
    {
      title: 'People',
      items: [{ schema: authorSchema }],
    },
    {
      title: 'Settings',
      items: [{ schema: newsletterSettingsSchema, mode: 'singleton' }],
    },
  ],
};
