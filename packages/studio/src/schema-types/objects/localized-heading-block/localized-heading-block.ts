import { HEADING_REQUIRED_MESSAGE } from '@blog/studio/schema-types/objects/heading-block/heading-block';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { defineField, defineType } from 'sanity';

export const localizedHeadingBlockSchema = defineType({
  name: 'localizedHeadingBlock',
  title: 'Heading Block',
  type: 'object',
  description:
    'The main heading and its optional supporting line, per language.',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'internationalizedArrayString',
      description: 'The heading text shown to readers, per language.',
      validation: (rule) =>
        rule.custom(validateDefaultLanguageFilled(HEADING_REQUIRED_MESSAGE)),
    }),
    defineField({
      name: 'supportingText',
      title: 'Supporting Text',
      type: 'internationalizedArrayText',
      description:
        'Optional line of supporting text shown beneath the heading, per language.',
    }),
  ],
});
