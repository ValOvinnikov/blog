import { PAGE_TEMPLATE_TYPE } from '@blog/studio/schema-types/documents/page-template/page-template-type';
import { validateTemplateMatchesDefaultLanguage } from '@blog/studio/schema-types/validation/validate-template-matches-default-language/validate-template-matches-default-language';
import { defineField } from 'sanity';

export const templateField = () =>
  defineField({
    name: 'template',
    title: 'Template',
    type: 'reference',
    description:
      'The hero and modules this page shows. Every language of a page usually shares one template; edit it under Templates.',
    to: [{ type: PAGE_TEMPLATE_TYPE }],
    options: { documentInternationalization: { exclude: true } },
    validation: (rule) => [
      rule.required(),
      rule.custom(validateTemplateMatchesDefaultLanguage).warning(),
    ],
  });
