import {
  imageAltField,
  imageHotspotOptions,
} from '@blog/studio/schema-types/fields/image-alt-field/image-alt-field';
import { defineType } from 'sanity';

export const imageWithAltSchema = defineType({
  name: 'imageWithAlt',
  title: 'Image with Alt Text',
  type: 'image',
  description:
    'An image together with its required alt text, for accessibility and search engines.',
  options: imageHotspotOptions,
  fields: [imageAltField()],
});
