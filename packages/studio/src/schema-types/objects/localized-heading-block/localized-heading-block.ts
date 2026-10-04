import { localizedMultilineTextField } from '@blog/studio/schema-types/fields/localized-multiline-text-field/localized-multiline-text-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { HEADING_REQUIRED_MESSAGE } from '@blog/studio/schema-types/objects/heading-block/heading-block';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { defineType } from 'sanity';

export const localizedHeadingBlockSchema = defineType({
  name: 'localizedHeadingBlock',
  title: 'Heading Block',
  type: 'object',
  description:
    'The main heading and its optional supporting line, per language.',
  options: { collapsible: true, collapsed: false },
  fields: [
    localizedOneLineTextField({
      name: 'heading',
      title: 'Heading',
      description: 'The heading text shown to readers, per language.',
      validation: (rule) =>
        rule.custom(validateDefaultLanguageFilled(HEADING_REQUIRED_MESSAGE)),
    }),
    localizedMultilineTextField({
      name: 'supportingText',
      title: 'Supporting Text',
      description:
        'Optional line of supporting text shown beneath the heading, per language.',
    }),
  ],
});
