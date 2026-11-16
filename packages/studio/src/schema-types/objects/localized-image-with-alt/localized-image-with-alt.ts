import { imageHotspotOptions } from '@shinefold/studio/schema-types/fields/image-alt-field/image-alt-field';
import { localizedOneLineTextField } from '@shinefold/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { validateImageAltFilled } from '@shinefold/studio/schema-types/validation/validate-image-alt-filled/validate-image-alt-filled';
import { defineType } from 'sanity';

export const localizedImageWithAltSchema = defineType({
  name: 'localizedImageWithAlt',
  title: 'Image with Alt Text',
  type: 'image',
  description:
    'An image together with its alt text, for accessibility and search engines.',
  options: imageHotspotOptions,
  fields: [
    localizedOneLineTextField({
      name: 'alt',
      title: 'Alternative Text',
      description: 'Describe the image for screen readers and search engines.',
      validation: (rule) =>
        rule.custom(validateImageAltFilled('Describe the image.')),
    }),
  ],
});
