import { featureBlockSchema } from '@blog/studio/schema-types/documents/blocks/feature/feature';
import { blockTestimonialSchema } from '@blog/studio/schema-types/documents/blocks/testimonial/testimonial';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import type { TStructureSection } from '@blog/studio/structure/build-section/build-section';
import { Boxes } from 'lucide-react';

export const blocksSection: TStructureSection = {
  title: 'Blocks',
  id: 'blocks',
  icon: Boxes,
  groups: [
    {
      title: 'Cards',
      items: [{ schema: featureBlockSchema }],
    },
    {
      title: 'Testimonials',
      items: [{ schema: blockTestimonialSchema }],
    },
    {
      title: 'Links',
      items: [{ schema: linkSchema }],
    },
  ],
};
