import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { Check } from 'lucide-react';
import { defineType } from 'sanity';

const TEXT_MAX_LENGTH = 80;

export const pricingFeatureSchema = defineType({
  name: 'pricingFeature',
  title: 'Feature',
  type: 'object',
  description: 'One line of what a tier includes.',
  icon: Check,
  fields: [
    localizedOneLineTextField({
      name: 'text',
      title: 'Text',
      description: 'What the tier includes, in one line, per language.',
      validation: (rule) =>
        rule.custom(
          validateLocalizedMaxLength(
            TEXT_MAX_LENGTH,
            `Keep each feature under ${TEXT_MAX_LENGTH} characters.`,
          ),
        ),
    }),
  ],
  preview: {
    select: { text: 'text' },
    prepare({ text }) {
      return { title: defaultLanguageValue(text) };
    },
  },
});
