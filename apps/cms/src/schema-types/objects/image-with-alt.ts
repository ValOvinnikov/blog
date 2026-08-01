import {
  imageAltField,
  imageHotspotOptions,
} from '@cms/schema-types/helpers/image-alt-field';
import { defineType } from 'sanity';

export const imageWithAltSchema = defineType({
  name: 'imageWithAlt',
  title: 'Image with Alt Text',
  type: 'image',
  options: imageHotspotOptions,
  fields: [imageAltField()],
});
