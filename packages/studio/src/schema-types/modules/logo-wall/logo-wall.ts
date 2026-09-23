import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { logoItemSchema } from '@blog/studio/schema-types/objects/logo-item/logo-item';
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
      description: 'The logos shown in this section, in display order.',
      of: [defineArrayMember({ type: logoItemSchema.name })],
      validation: (rule) => [
        rule.required().error('A logo wall needs at least one logo.'),
        rule.unique().error('Each logo can only appear once.'),
        rule.min(1).error('A logo wall needs at least one logo.'),
        rule.max(12).error('A logo wall holds at most twelve logos.'),
      ],
    }),
    ctaButtonsField(),
    displayModeField(),
    ...alignmentFields([]),
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
