import { imageHotspotOptions } from '@blog/studio/schema-types/fields/image-alt-field/image-alt-field';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { defineField, defineType } from 'sanity';

export const localizedImageWithAltSchema = defineType({
  name: 'localizedImageWithAlt',
  title: 'Image with Alt Text',
  type: 'image',
  description:
    'An image together with its alt text per language, for accessibility and search engines.',
  options: imageHotspotOptions,
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative Text',
      type: 'internationalizedArrayString',
      description:
        'Describe the image for screen readers and search engines, per language.',
      validation: (rule) =>
        rule.custom(validateDefaultLanguageFilled('Describe the image.')),
    }),
  ],
});
