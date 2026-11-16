import { homeTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/home/home';
import { landingTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/landing/landing';
import { legalIndexTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/legal-index/legal-index';
import { postIndexTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/post-index/post-index';
import { privacyIndexTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/privacy-index/privacy-index';
import { tagTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/tag/tag';
import { tagIndexTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/tag-index/tag-index';
import { topicTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/topic/topic';
import { topicIndexTemplateSchema } from '@shinefold/studio/schema-types/documents/templates/topic-index/topic-index';
import type { TStructureSection } from '@shinefold/studio/structure/build-section/build-section';
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
    {
      title: 'Privacy',
      items: [{ schema: privacyIndexTemplateSchema }],
    },
    {
      title: 'Legal',
      items: [{ schema: legalIndexTemplateSchema }],
    },
  ],
};
