import { homeTemplateSchema } from '@blog/studio/schema-types/documents/templates/home/home';
import { landingTemplateSchema } from '@blog/studio/schema-types/documents/templates/landing/landing';
import { postIndexTemplateSchema } from '@blog/studio/schema-types/documents/templates/post-index/post-index';
import { tagTemplateSchema } from '@blog/studio/schema-types/documents/templates/tag/tag';
import { tagIndexTemplateSchema } from '@blog/studio/schema-types/documents/templates/tag-index/tag-index';
import { topicTemplateSchema } from '@blog/studio/schema-types/documents/templates/topic/topic';
import { topicIndexTemplateSchema } from '@blog/studio/schema-types/documents/templates/topic-index/topic-index';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { LayoutTemplate } from 'lucide-react';

export const templatesSection: TStructureSection = {
  title: 'Templates',
  id: 'templates',
  icon: LayoutTemplate,
  groups: [
    {
      title: 'Home',
      items: [{ schema: homeTemplateSchema }],
    },
    {
      title: 'Landing',
      items: [{ schema: landingTemplateSchema }],
    },
    {
      title: 'Blog',
      items: [
        { schema: postIndexTemplateSchema },
        { schema: topicIndexTemplateSchema },
        { schema: topicTemplateSchema },
        { schema: tagIndexTemplateSchema },
        { schema: tagTemplateSchema },
      ],
    },
  ],
};
