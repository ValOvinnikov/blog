import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home/home';
import { landingPageSchema } from '@blog/studio/schema-types/documents/pages/landing/landing';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Files } from 'lucide-react';

export const pagesSection: TStructureSection = {
  title: 'Pages',
  id: 'pages',
  icon: Files,
  groups: [
    {
      items: [
        { schema: homePageSchema, mode: 'singleton' },
        { schema: landingPageSchema },
      ],
    },
  ],
};
