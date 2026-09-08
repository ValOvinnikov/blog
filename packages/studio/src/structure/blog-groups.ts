import { authorSchema } from '@blog/studio/schema-types/documents/blog/author';
import { postSchema } from '@blog/studio/schema-types/documents/blog/post';
import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic';
import { blogPageSchema } from '@blog/studio/schema-types/documents/pages/blog-page';
import { pagePostSchema } from '@blog/studio/schema-types/documents/pages/page-post';
import { pageTagSchema } from '@blog/studio/schema-types/documents/pages/page-tag';
import { pageTopicSchema } from '@blog/studio/schema-types/documents/pages/page-topic';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index-page';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index-page';
import { newsletterSettingsSchema } from '@blog/studio/schema-types/documents/settings/newsletter';
import type { TStructureGroup } from '@blog/studio/structure/build-grouped-list';

export const blogGroups: TStructureGroup[] = [
  {
    title: 'Pages',
    items: [
      { schema: blogPageSchema, mode: 'singleton' },
      { schema: pagePostSchema },
      { schema: topicIndexPageSchema, mode: 'singleton' },
      { schema: pageTopicSchema },
      { schema: tagIndexPageSchema, mode: 'singleton' },
      { schema: pageTagSchema },
    ],
  },
  {
    title: 'Content',
    items: [
      { schema: postSchema },
      { schema: topicSchema },
      { schema: tagSchema },
      { schema: authorSchema },
    ],
  },
  {
    title: 'Settings',
    items: [{ schema: newsletterSettingsSchema, mode: 'singleton' }],
  },
];
