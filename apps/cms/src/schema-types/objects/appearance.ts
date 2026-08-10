import {
  ALIGN,
  BACKGROUND_TONE,
  CONTAINER_WIDTH,
  SPACING_SCALE,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { SlidersHorizontal } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const spacingOptions = [
  { title: 'None', value: SPACING_SCALE.NONE },
  { title: 'Small', value: SPACING_SCALE.SM },
  { title: 'Medium', value: SPACING_SCALE.MD },
  { title: 'Large', value: SPACING_SCALE.LG },
  { title: 'Extra large', value: SPACING_SCALE.XL },
];

export const appearanceSchema = defineType({
  name: 'appearance',
  title: 'Appearance',
  type: 'object',
  icon: SlidersHorizontal,
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'background',
      title: 'Background',
      type: 'string',
      options: {
        list: Object.values(BACKGROUND_TONE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'spacingTop',
      title: 'Spacing Top',
      type: 'string',
      options: { list: spacingOptions },
    }),
    defineField({
      name: 'spacingBottom',
      title: 'Spacing Bottom',
      type: 'string',
      options: { list: spacingOptions },
    }),
    defineField({
      name: 'containerWidth',
      title: 'Container Width',
      type: 'string',
      options: {
        list: Object.values(CONTAINER_WIDTH).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'align',
      title: 'Align',
      type: 'string',
      options: {
        list: Object.values(ALIGN).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'divider',
      title: 'Divider',
      type: 'boolean',
    }),
  ],
});
