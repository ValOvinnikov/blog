import { IMAGE_LAYOUT } from '@blog/config/constants';
import {
  imageAltField,
  imageHotspotOptions,
} from '@blog/studio/schema-types/helpers/image-alt-field';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField, defineType } from 'sanity';

/**
 * Image type used only inside `richTextSchema`'s body array. Composes the
 * same `alt` field as `imageWithAltSchema` (shared, not duplicated — see
 * `helpers/image-alt-field`) plus a `layout` choice that is meaningful for
 * body content but not for hero/avatar/brand/OG/site-settings images, which
 * stay on `imageWithAltSchema` unmodified.
 */
export const bodyImageSchema = defineType({
  name: 'bodyImage',
  title: 'Body Image',
  type: 'image',
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
        layout: 'radio',
        list: Object.values(IMAGE_LAYOUT).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
  ],
});
