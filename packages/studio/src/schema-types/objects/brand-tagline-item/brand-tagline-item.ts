import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { defineType } from 'sanity';

const TEXT_MAX_LENGTH = 15;

export const brandTaglineItemSchema = defineType({
  name: 'brandTaglineItem',
  title: 'Item',
  type: 'object',
  fields: [
    localizedOneLineTextField({
      name: 'text',
      title: 'Text',
      description: 'One short segment, e.g. "online".',
      validation: (rule) => [
        rule.custom(validateDefaultLanguageFilled('Add the item text.')),
        rule.custom(
          validateLocalizedMaxLength(
            TEXT_MAX_LENGTH,
            `Keep each item under ${TEXT_MAX_LENGTH} characters.`,
          ),
        ),
      ],
    }),
  ],
  preview: {
    select: { text: 'text' },
    prepare({ text }) {
      return { title: defaultLanguageValue(text) };
    },
  },
});
