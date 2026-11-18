import { localizedOneLineTextField } from '@shinefold/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { linkRefSchema } from '@shinefold/studio/schema-types/objects/link-ref/link-ref';
import { countLabel } from '@shinefold/studio/schema-types/preview/count-label/count-label';
import { defaultLanguageValue } from '@shinefold/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageFilled } from '@shinefold/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { Rows3 } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const footerLinkGroupSchema = defineType({
  name: 'footerLinkGroup',
  title: 'Link Group',
  type: 'object',
  description: 'A column of links in the site footer, under its own heading.',
  icon: Rows3,
  fields: [
    localizedOneLineTextField({
      name: 'heading',
      title: 'Heading',
      description: 'The heading shown above these links, e.g. "Company".',
      validation: (rule) =>
        rule.custom(validateDefaultLanguageFilled('Add a heading.')),
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      description: 'The links listed under the heading, in this order.',
      of: [defineArrayMember({ type: linkRefSchema.name })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { heading: 'heading', links: 'links' },
    prepare({ heading, links }) {
      return {
        title: defaultLanguageValue(heading) ?? 'Untitled group',
        subtitle: countLabel(links, 'link'),
      };
    },
  },
});
