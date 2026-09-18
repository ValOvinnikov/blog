import { FULL_BRAND_VARIANT_LIST } from '@blog/config/constants';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { ctaButtonsField } from '@blog/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { heroContentPositionFields } from '@blog/studio/schema-types/fields/hero-content-position-fields/hero-content-position-fields';
import { heroFieldsets } from '@blog/studio/schema-types/fields/hero-fields/hero-fields';
import { heroImageField } from '@blog/studio/schema-types/fields/hero-image-field/hero-image-field';
import { heroMediaOrderFields } from '@blog/studio/schema-types/fields/hero-media-order-fields/hero-media-order-fields';
import { heroVariantField } from '@blog/studio/schema-types/fields/hero-variant-field/hero-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { heroLayoutField } from '@blog/studio/schema-types/objects/hero-layout/hero-layout-field';
import { Quote } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const heroStatementSchema = defineType({
  name: 'module_heroStatement',
  title: 'Statement Hero',
  type: 'document',
  description:
    'A full-width opening section for making one bold statement: a headline you write yourself, a supporting line, up to two actions and an optional image. Use it when the page needs a clear message and a call to action rather than featured content.',
  icon: Quote,
  fieldsets: [...heroFieldsets],
  fields: [
    titleField(),
    brandVariantField({ list: FULL_BRAND_VARIANT_LIST }),
    headingBlockField(),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Short line above the heading.',
    }),
    ctaButtonsField(),
    heroVariantField(),
    heroImageField(),
    ...heroContentPositionFields(),
    ...heroMediaOrderFields(),
    heroLayoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'headingBlock.heading',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: subtitle ? String(subtitle) : 'No heading yet',
      };
    },
  },
});
