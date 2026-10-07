import { NEWSLETTER_VARIANT } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { variantField } from '@blog/studio/schema-types/fields/variant-field/variant-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleHeadingBlockField } from '@blog/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { newsletterTrustCueSchema } from '@blog/studio/schema-types/objects/newsletter-trust-cue/newsletter-trust-cue';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { toTitleCase } from '@blog/utils/primitives';
import { Mail } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const newsletterSchema = defineType({
  name: 'module_newsletter',
  title: 'Newsletter Signup',
  type: 'document',
  description:
    'A section inviting readers to subscribe by email, with a heading, a line of copy and the signup form.',
  icon: Mail,
  fields: [
    titleField(),
    brandVariantField(),
    variantField({
      values: NEWSLETTER_VARIANT,
      initialValue: NEWSLETTER_VARIANT.FULL,
      description:
        'Full shows the signup in its own panel with the trust cues. Compact is a slimmer version without them.',
      isRequired: false,
    }),
    moduleHeadingBlockField(),
    defineField({
      name: 'trustCues',
      title: 'Trust Cues',
      type: 'array',
      description: 'Short reassurances shown under the signup form.',
      of: [defineArrayMember({ type: newsletterTrustCueSchema.name })],
      hidden: ({ parent }) =>
        (parent as { variant?: string } | undefined)?.variant ===
        NEWSLETTER_VARIANT.COMPACT,
      validation: (rule) => rule.max(2),
    }),
    ...alignmentFields([], { alignsItems: true }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      variant: 'variant',
    },
    prepare({ title, brandVariant, variant }) {
      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          typeof variant === 'string' ? toTitleCase(variant) : undefined,
        ),
      };
    },
  },
});
