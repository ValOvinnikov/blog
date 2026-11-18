import { CONTENT_ALIGNMENT } from '@shinefold/config/constants';
import { alignmentFields } from '@shinefold/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@shinefold/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@shinefold/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { displayModeField } from '@shinefold/studio/schema-types/fields/display-mode-field/display-mode-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { layoutField } from '@shinefold/studio/schema-types/objects/layout/layout-field';
import { logoItemSchema } from '@shinefold/studio/schema-types/objects/logo-item/logo-item';
import { moduleHeadingBlockField } from '@shinefold/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { countLabel } from '@shinefold/studio/schema-types/preview/count-label/count-label';
import { moduleSubtitle } from '@shinefold/studio/schema-types/preview/module-subtitle/module-subtitle';
import { Images } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const NO_LOGOS_ERROR = 'A logo wall needs at least one logo.';

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
    moduleHeadingBlockField(),
    defineField({
      name: 'logos',
      title: 'Logos',
      type: 'array',
      description: 'The logos shown in this section, in display order.',
      of: [defineArrayMember({ type: logoItemSchema.name })],
      validation: (rule) => [
        rule.required().error(NO_LOGOS_ERROR),
        rule.min(1).error(NO_LOGOS_ERROR),
        rule.max(12).error('A logo wall holds at most twelve logos.'),
      ],
    }),
    ctaButtonsField(),
    displayModeField(),
    ...alignmentFields([], {
      allow: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
      hasActions: true,
      alignsItems: true,
      alignsCarousel: true,
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
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(brandVariant, countLabel(logos, 'logo')),
      };
    },
  },
});
