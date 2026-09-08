import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home-page';
import { genericSchema } from '@blog/studio/schema-types/documents/pages/page';
import type { TStructureGroup } from '@blog/studio/structure/build-grouped-list';

export const pagesGroups: TStructureGroup[] = [
  {
    items: [
      { schema: homePageSchema, mode: 'singleton' },
      { schema: genericSchema },
    ],
  },
];
