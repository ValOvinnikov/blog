import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home-page';
import { landingSchema } from '@blog/studio/schema-types/documents/pages/landing';
import type { TStructureGroup } from '@blog/studio/structure/build-grouped-list';

export const pagesGroups: TStructureGroup[] = [
  {
    items: [
      { schema: homePageSchema, mode: 'singleton' },
      { schema: landingSchema },
    ],
  },
];
