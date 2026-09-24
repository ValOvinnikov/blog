import { personSchema } from '@blog/studio/schema-types/documents/person/person';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Users } from 'lucide-react';

export const peopleSection: TStructureSection = {
  title: 'People',
  id: 'people',
  icon: Users,
  flattenSingleItem: true,
  groups: [
    {
      items: [{ schema: personSchema }],
    },
  ],
};
