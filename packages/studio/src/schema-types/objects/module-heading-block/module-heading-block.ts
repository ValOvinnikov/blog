import { localizedHeadingTextField } from '@shinefold/studio/schema-types/fields/localized-heading-text-field/localized-heading-text-field';
import { localizedMultilineTextField } from '@shinefold/studio/schema-types/fields/localized-multiline-text-field/localized-multiline-text-field';
import { HEADING_REQUIRED_MESSAGE } from '@shinefold/studio/schema-types/objects/page-heading-block/page-heading-block';
import { validateDefaultLanguageBlockTextFilled } from '@shinefold/studio/schema-types/validation/validate-default-language-block-text-filled/validate-default-language-block-text-filled';
import { defineType } from 'sanity';

export const moduleHeadingBlockSchema = defineType({
  name: 'moduleHeadingBlock',
  title: 'Heading Block',
  type: 'object',
  description: 'The main heading and its optional supporting line.',
  options: { collapsible: true, collapsed: false },
  fields: [
    localizedHeadingTextField({
      name: 'heading',
      title: 'Heading',
      description:
        'The heading text shown to readers. Select words and press Highlight to make them stand out.',
      validation: (rule) =>
        rule.custom(
          validateDefaultLanguageBlockTextFilled(HEADING_REQUIRED_MESSAGE),
        ),
    }),
    localizedMultilineTextField({
      name: 'supportingText',
      title: 'Supporting Text',
      description:
        'Optional line of supporting text shown beneath the heading.',
    }),
  ],
});
