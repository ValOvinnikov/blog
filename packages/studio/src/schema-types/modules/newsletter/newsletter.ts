import {
  BRAND_VARIANT,
  FULL_BRAND_VARIANT_LIST,
  NEWSLETTER_VARIANT,
} from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { localizedHeadingBlockField } from '@blog/studio/schema-types/objects/localized-heading-block/localized-heading-block-field';
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
    brandVariantField({
      list: FULL_BRAND_VARIANT_LIST,
      initialValue: BRAND_VARIANT.PRIMARY,
    }),
    localizedHeadingBlockField(),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      description: 'How much space the form takes up.',
      options: {
        layout: 'dropdown',
        list: Object.values(NEWSLETTER_VARIANT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: NEWSLETTER_VARIANT.FULL,
    }),
    defineField({
      name: 'trustCues',
      title: 'Trust Cues',
      type: 'array',
      description:
        'Short reassurances shown under the signup form. Every language shares the list; only the wording is translated.',
      of: [defineArrayMember({ type: newsletterTrustCueSchema.name })],
      validation: (rule) => rule.max(2),
    }),
    ...alignmentFields([], {
      title: 'Heading Alignment',
      description: 'Horizontal alignment of the heading and supporting text.',
    }),
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
