import { pageTemplateSchema } from '@blog/studio/schema-types/documents/page-template/page-template';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { LayoutTemplate } from 'lucide-react';

export const templatesSection: TStructureSection = {
  title: 'Templates',
  id: 'templates',
  icon: LayoutTemplate,
  flattenSingleItem: true,
  groups: [
    {
      items: [{ schema: pageTemplateSchema }],
    },
  ],
};
