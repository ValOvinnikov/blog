import { validateTemplateMatchesDefaultLanguage } from '@blog/studio/schema-types/validation/validate-template-matches-default-language/validate-template-matches-default-language';
import { defineField } from 'sanity';

export const templateField = ({ type }: { type: string }) =>
  defineField({
    name: 'template',
    title: 'Template',
    type: 'reference',
    description:
      'The hero and modules this page shows. Edit it under Templates.',
    to: [{ type }],
    options: { documentInternationalization: { exclude: true } },
    validation: (rule) => [
      rule.required(),
      rule.custom(validateTemplateMatchesDefaultLanguage).warning(),
    ],
  });
