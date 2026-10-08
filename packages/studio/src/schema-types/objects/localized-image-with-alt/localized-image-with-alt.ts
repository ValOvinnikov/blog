import { imageHotspotOptions } from '@blog/studio/schema-types/fields/image-alt-field/image-alt-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { LocalizedImageInput } from '@blog/studio/schema-types/inputs/localized-image-input/localized-image-input';
import { validateImageAltFilled } from '@blog/studio/schema-types/validation/validate-image-alt-filled/validate-image-alt-filled';
import { defineType } from 'sanity';

export const localizedImageWithAltSchema = defineType({
  name: 'localizedImageWithAlt',
  title: 'Image with Alt Text',
  type: 'image',
  description:
    'An image together with its alt text, for accessibility and search engines.',
  options: imageHotspotOptions,
  components: { input: LocalizedImageInput },
  fields: [
    localizedOneLineTextField({
      name: 'alt',
      title: 'Alternative Text',
      description: 'Describe the image for screen readers and search engines.',
      // Hidden until an asset exists, or the language plugin seeds an empty entry into an unset image.
      hidden: ({ parent }) =>
        !(parent as { asset?: unknown } | undefined)?.asset,
      validation: (rule) =>
        rule.custom(validateImageAltFilled('Describe the image.')),
    }),
  ],
});
