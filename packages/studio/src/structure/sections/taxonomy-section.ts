import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Tags } from 'lucide-react';

export const taxonomySection: TStructureSection = {
  title: 'Taxonomy',
  id: 'taxonomy',
  icon: Tags,
  groups: [
    {
      items: [{ schema: topicSchema }, { schema: tagSchema }],
    },
  ],
};
