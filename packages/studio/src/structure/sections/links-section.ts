import { sharedLinkSchema } from '@blog/studio/schema-types/documents/shared/link/link';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Link2 } from 'lucide-react';

export const linksSection: TStructureSection = {
  title: 'Links',
  id: 'links',
  icon: Link2,
  groups: [
    {
      items: [{ schema: sharedLinkSchema }],
    },
  ],
};
