import { blogPageSchema } from '@blog/studio/schema-types/documents/pages/blog-page';
import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home-page';
import { genericSchema } from '@blog/studio/schema-types/documents/pages/page';
import { pagePostSchema } from '@blog/studio/schema-types/documents/pages/page-post';
import { pageTagSchema } from '@blog/studio/schema-types/documents/pages/page-tag';
import { pageTopicSchema } from '@blog/studio/schema-types/documents/pages/page-topic';
import { tagIndexPageSchema } from '@blog/studio/schema-types/documents/pages/tag-index-page';
import { topicIndexPageSchema } from '@blog/studio/schema-types/documents/pages/topic-index-page';
import type { TStructureGroup } from '@blog/studio/structure/build-grouped-list';
import {
  FileText,
  House,
  Layers,
  LayoutGrid,
  Newspaper,
  Tag,
  Tags,
} from 'lucide-react';

export const pagesGroups: TStructureGroup[] = [
  {
    title: 'Home',
    items: [
      {
        documentType: homePageSchema.name,
        title: 'Home Page',
        icon: House,
        mode: 'singleton',
      },
    ],
  },
  {
    title: 'Blog',
    items: [
      {
        documentType: blogPageSchema.name,
        title: 'Post Index Page',
        icon: Newspaper,
        mode: 'singleton',
      },
      {
        documentType: pagePostSchema.name,
        title: 'Post Pages',
        icon: FileText,
      },
      {
        documentType: topicIndexPageSchema.name,
        title: 'Topic Index Page',
        icon: LayoutGrid,
        mode: 'singleton',
      },
      {
        documentType: pageTopicSchema.name,
        title: 'Topic Pages',
        icon: Layers,
      },
      {
        documentType: tagIndexPageSchema.name,
        title: 'Tag Index Page',
        icon: Tags,
        mode: 'singleton',
      },
      { documentType: pageTagSchema.name, title: 'Tag Pages', icon: Tag },
    ],
  },
  {
    title: 'General',
    items: [
      {
        documentType: genericSchema.name,
        title: 'Landing Page',
        icon: FileText,
      },
    ],
  },
];
