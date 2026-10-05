import { localizedListedTextField } from '@blog/studio/schema-types/fields/localized-listed-text-field/localized-listed-text-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { ctaSecondaryButtonSchema } from '@blog/studio/schema-types/objects/cta-button/cta-button';
import { localizedImageWithAltSchema } from '@blog/studio/schema-types/objects/localized-image-with-alt/localized-image-with-alt';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateDefaultLanguageBlocksFilled } from '@blog/studio/schema-types/validation/validate-default-language-blocks-filled/validate-default-language-blocks-filled';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateImageHasAsset } from '@blog/studio/schema-types/validation/validate-image-has-asset/validate-image-has-asset';
import { Columns2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const featureHighlightSchema = defineType({
  name: 'featureHighlight',
  title: 'Highlight',
  type: 'object',
  description: 'One row of the story, pairing an image with its text.',
  icon: Columns2,
  fields: [
    localizedOneLineTextField({
      name: 'heading',
      title: 'Heading',
      description: 'The point this row makes, in a few words.',
      validation: (rule) =>
        rule.custom(validateDefaultLanguageFilled('Give the row a heading.')),
    }),
    localizedListedTextField({
      name: 'body',
      title: 'Body',
      description: 'The explanation behind it, in a sentence or two.',
      validation: (rule) =>
        rule.custom(
          validateDefaultLanguageBlocksFilled('Explain the point of this row.'),
        ),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: localizedImageWithAltSchema.name,
      description:
        'Shown at 4:3 beside the text. Product screenshots and illustrations work best.',
      validation: (rule) =>
        rule.custom(validateImageHasAsset('Add an image for this row.')),
    }),
    defineField({
      name: 'action',
      title: 'Action',
      type: ctaSecondaryButtonSchema.name,
      description: 'Optional. One action under the text.',
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      media: 'image',
    },
    prepare({ heading, media }) {
      return {
        title: defaultLanguageValue(heading),
        media,
      };
    },
  },
});
