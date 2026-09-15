import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Link2 } from 'lucide-react';

export const linksSection: TStructureSection = {
  title: 'Links',
  id: 'links',
  icon: Link2,
  flattenSingleItem: true,
  groups: [
    {
      items: [{ schema: linkSchema }],
    },
  ],
};
