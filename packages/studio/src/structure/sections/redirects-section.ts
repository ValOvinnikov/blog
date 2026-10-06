import { redirectSchema } from '@blog/studio/schema-types/documents/redirect/redirect';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Signpost } from 'lucide-react';

export const redirectsSection: TStructureSection = {
  title: 'Redirects',
  id: 'redirects',
  icon: Signpost,
  flattenSingleItem: true,
  groups: [{ items: [{ schema: redirectSchema }] }],
};
