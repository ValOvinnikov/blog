import { HEADING_REQUIRED_MESSAGE } from '@blog/studio/schema-types/objects/heading-block/heading-block';
import { localizedStringValues } from '@blog/studio/schema-types/validation/localized-string-values/localized-string-values';
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
        rule.custom((value) =>
          localizedStringValues(value).length === 0
            ? HEADING_REQUIRED_MESSAGE
            : true,
        ),
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
