import { homePageSchema } from '@blog/studio/schema-types/documents/pages/home-page';
import { genericSchema } from '@blog/studio/schema-types/documents/pages/page';
import type { TStructureGroupItem } from '@blog/studio/structure/build-grouped-list';

export const pagesItems: TStructureGroupItem[] = [
  { schema: homePageSchema, mode: 'singleton' },
  { schema: genericSchema },
];
