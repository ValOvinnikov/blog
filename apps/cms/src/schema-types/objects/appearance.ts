import {
  ALIGN,
  BACKGROUND_TONE,
  CONTAINER_WIDTH,
  SPACING_SCALE,
} from '@blog/config/constants';
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
        list: [
          { title: 'Default', value: BACKGROUND_TONE.DEFAULT },
          { title: 'Subtle', value: BACKGROUND_TONE.SUBTLE },
          { title: 'Surface', value: BACKGROUND_TONE.SURFACE },
          { title: 'Accent tint', value: BACKGROUND_TONE.ACCENT_TINT },
          { title: 'Inverse', value: BACKGROUND_TONE.INVERSE },
        ],
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
        list: [
          { title: 'Narrow', value: CONTAINER_WIDTH.NARROW },
          { title: 'Wide', value: CONTAINER_WIDTH.WIDE },
          { title: 'Full', value: CONTAINER_WIDTH.FULL },
        ],
      },
    }),
    defineField({
      name: 'align',
      title: 'Align',
      type: 'string',
      options: {
        list: [
          { title: 'Start', value: ALIGN.START },
          { title: 'Center', value: ALIGN.CENTER },
        ],
      },
    }),
    defineField({
      name: 'divider',
      title: 'Divider',
      type: 'boolean',
    }),
  ],
});
