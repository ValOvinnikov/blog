import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { Hash } from 'lucide-react';
import { defineType } from 'sanity';

const VALUE_MAX_LENGTH = 8;
const LABEL_MAX_LENGTH = 48;

export const statSchema = defineType({
  name: 'stat',
  title: 'Stat',
  type: 'object',
  description: 'One figure and what it counts, for a band of stats.',
  icon: Hash,
  fields: [
    localizedOneLineTextField({
      name: 'value',
      title: 'Value',
      description: 'The figure as it should read. Kept short.',
      validation: (rule) => [
        rule.custom(validateDefaultLanguageFilled('Add the figure.')),
        rule
          .custom(
            validateLocalizedMaxLength(
              VALUE_MAX_LENGTH,
              'Long values stop reading as a figure — try an abbreviation like 2.4M.',
            ),
          )
          .warning(),
      ],
    }),
    localizedOneLineTextField({
      name: 'label',
      title: 'Label',
      description: 'What the figure counts. A few words, not a sentence.',
      validation: (rule) => [
        rule.custom(validateDefaultLanguageFilled('Add a label.')),
        rule
          .custom(
            validateLocalizedMaxLength(
              LABEL_MAX_LENGTH,
              'Long labels wrap under narrow columns — a few words reads best.',
            ),
          )
          .warning(),
      ],
    }),
    localizedOneLineTextField({
      name: 'description',
      title: 'Description',
      description:
        'Optional line of context under the label — scope, period, or sample.',
    }),
  ],
  preview: {
    select: {
      value: 'value',
      label: 'label',
    },
    prepare({ value, label }) {
      return {
        title: defaultLanguageValue(value),
        subtitle: defaultLanguageValue(label),
      };
    },
  },
});
