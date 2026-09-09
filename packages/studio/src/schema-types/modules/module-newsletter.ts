import { NEWSLETTER_VARIANT } from '@blog/config/constants';
import { brandVariantField } from '@blog/studio/schema-types/helpers/brand-variant-field';
import { defineAlignmentFields } from '@blog/studio/schema-types/helpers/define-alignment-fields';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { toTitleCase } from '@blog/utils/primitives';
import { Mail } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const newsletterSchema = defineType({
  name: 'module_newsletter',
  title: 'Newsletter Signup',
  type: 'document',
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
        layout: 'radio',
        list: Object.values(NEWSLETTER_VARIANT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: NEWSLETTER_VARIANT.FULL,
    }),
    ...defineAlignmentFields([]),
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
