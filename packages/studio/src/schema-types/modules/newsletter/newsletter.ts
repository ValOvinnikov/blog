import { NEWSLETTER_VARIANT } from '@blog/config/constants';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { toTitleCase } from '@blog/utils/primitives';
import { Mail } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const newsletterSchema = defineType({
  name: 'module_newsletter',
  title: 'Newsletter Signup',
  type: 'document',
  description:
    'A newsletter signup form, in a full or compact layout, used to collect subscriber emails.',
  icon: Mail,
  fields: [
    titleField({ description: 'Internal label shown in the Studio.' }),
    brandVariantField(),
    headingBlockField({ requireHeading: true }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      description: 'Full form, or a compact variant for tighter layouts.',
      options: {
        layout: 'dropdown',
        list: Object.values(NEWSLETTER_VARIANT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: NEWSLETTER_VARIANT.FULL,
    }),
    ...alignmentFields([]),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'headingBlock.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle,
      };
    },
  },
});
