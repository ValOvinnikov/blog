import { homeTemplateSchema } from '@blog/studio/schema-types/documents/templates/home/home';
import { landingTemplateSchema } from '@blog/studio/schema-types/documents/templates/landing/landing';
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
  ],
};
