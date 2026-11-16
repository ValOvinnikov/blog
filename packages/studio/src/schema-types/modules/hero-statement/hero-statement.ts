import { ctaButtonsField } from '@shinefold/studio/schema-types/fields/cta-buttons-field/cta-buttons-field';
import { heroBackgroundAndShapeFields } from '@shinefold/studio/schema-types/fields/hero-background-and-shape-fields/hero-background-and-shape-fields';
import { heroContentPositionFields } from '@shinefold/studio/schema-types/fields/hero-content-position-fields/hero-content-position-fields';
import { heroImageField } from '@shinefold/studio/schema-types/fields/hero-image-field/hero-image-field';
import {
  heroMediaOrderSplitField,
  heroMediaOrderStackedField,
} from '@shinefold/studio/schema-types/fields/hero-media-order-fields/hero-media-order-fields';
import { localizedOneLineTextField } from '@shinefold/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { titleField } from '@shinefold/studio/schema-types/fields/title-field/title-field';
import { heroFieldsets } from '@shinefold/studio/schema-types/modules/hero-fieldsets/hero-fieldsets';
import { heroLayoutField } from '@shinefold/studio/schema-types/objects/hero-layout/hero-layout-field';
import { moduleHeadingBlockField } from '@shinefold/studio/schema-types/objects/module-heading-block/module-heading-block-field';
import { defaultLanguageValue } from '@shinefold/studio/schema-types/validation/default-language-value/default-language-value';
import { Quote } from 'lucide-react';
import { defineType } from 'sanity';

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
    ...heroBackgroundAndShapeFields(),
    moduleHeadingBlockField(),
    localizedOneLineTextField({
      name: 'eyebrow',
      title: 'Eyebrow',
      description: 'Short line above the heading.',
    }),
    heroImageField(),
    ctaButtonsField(),
    ...heroContentPositionFields(),
    heroMediaOrderSplitField(),
    heroMediaOrderStackedField(),
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
        subtitle: defaultLanguageValue(subtitle),
      };
    },
  },
});
