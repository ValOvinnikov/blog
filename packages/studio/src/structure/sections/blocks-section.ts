import { faqBlockSchema } from '@shinefold/studio/schema-types/documents/blocks/faq/faq';
import { featureBlockSchema } from '@shinefold/studio/schema-types/documents/blocks/feature/feature';
import { blockTestimonialSchema } from '@shinefold/studio/schema-types/documents/blocks/testimonial/testimonial';
import { linkSchema } from '@shinefold/studio/schema-types/documents/link/link';
import type { TStructureSection } from '@shinefold/studio/structure/build-section/build-section';
import { Boxes } from 'lucide-react';

export const blocksSection: TStructureSection = {
  title: 'Blocks',
  id: 'blocks',
  icon: Boxes,
  groups: [
    {
      title: 'Cards',
      items: [
        { schema: featureBlockSchema },
        { schema: blockTestimonialSchema },
      ],
    },
    {
      title: 'FAQs',
      items: [{ schema: faqBlockSchema }],
    },
    {
      title: 'Links',
      items: [{ schema: linkSchema }],
    },
  ],
};
