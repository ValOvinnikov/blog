import { logoBlockSchema } from '@blog/studio/schema-types/documents/blocks/logo/logo';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { Images } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const logoWallSchema = defineType({
  name: 'module_logoWall',
  title: 'Logo Wall',
  type: 'document',
  description:
    'A grid or carousel of partner or client logos, used as social proof.',
  icon: Images,
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'logos',
      title: 'Logos',
      type: 'array',
      description:
        'Pick the logos to show, in order. Blocks → Logos holds the reusable documents.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: logoBlockSchema.name }],
        }),
      ],
      validation: (rule) =>
        rule
          .unique()
          .min(3)
          .error('A logo wall needs at least three logos.')
          .max(12)
          .error('A logo wall holds at most twelve logos.'),
    }),
    ctaButtonsField(),
    displayModeField({
      description: 'Grid wraps the logos in rows; Carousel scrolls them.',
    }),
    ...alignmentFields([], {
      description:
        'Horizontal alignment of the heading, supporting text and actions. Logos are always centred in their tiles.',
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      logos: 'logos',
    },
    prepare({ title, brandVariant, logos }) {
      const count = Array.isArray(logos) ? logos.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          `${String(count)} logo${count === 1 ? '' : 's'}`,
        ),
      };
    },
  },
});
