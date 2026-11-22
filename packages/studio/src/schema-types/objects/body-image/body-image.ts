import {
  IMAGE_LAYOUT,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@shinefold/config/constants';
import {
  imageAltField,
  imageHotspotOptions,
} from '@shinefold/studio/schema-types/fields/image-alt-field/image-alt-field';
import { toTitleCase } from '@shinefold/utils/primitives';
import { defineField, defineType } from 'sanity';

export const bodyImageSchema = defineType({
  name: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
  title: 'Body Image',
  type: 'image',
  description:
    'An image placed within body content, with its alt text and its position relative to the surrounding text.',
  options: imageHotspotOptions,
  fields: [
    imageAltField(),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      description:
        'How the image is positioned in body content. Leave unset to use the default (Inline).',
      options: {
        layout: 'dropdown',
        list: Object.values(IMAGE_LAYOUT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
  ],
});
