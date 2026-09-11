import { authorSchema } from '@blog/studio/schema-types/documents/blog/author';
import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic';
import { blogPageSchema } from '@blog/studio/schema-types/documents/pages/blog';
import { pagePostSchema } from '@blog/studio/schema-types/documents/pages/post';
import { pageTagSchema } from '@blog/studio/schema-types/documents/pages/tag';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index';
import { pageTopicSchema } from '@blog/studio/schema-types/documents/pages/topic';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index';
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
];
