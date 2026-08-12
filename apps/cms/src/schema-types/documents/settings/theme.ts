import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import { toTitleCase } from '@blog/utils';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { Palette } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const themeSchema = defineType({
  name: 'settings_theme',
  title: 'Theme',
  type: 'document',
  icon: Palette,
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({
      title: title ?? 'Unknown',
      subtitle: 'Theme settings',
    }),
  },
  fields: [
    titleField(),
    defineField({
      name: 'preset',
      title: 'Preset',
      type: 'string',
      description: 'Base preset the theme tokens below start from.',
      options: {
        layout: 'dropdown',
        list: Object.values(PRESET_ID).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'accentHue',
      title: 'Accent Hue',
      type: 'number',
      description: 'OKLCH hue channel driving the site-wide accent color.',
      validation: (rule) => rule.min(0).max(360),
    }),
    defineField({
      name: 'logoHue',
      title: 'Logo Hue',
      type: 'number',
      description:
        'OKLCH hue channel for the logo mark specifically. Defaults to Accent Hue when unset.',
      validation: (rule) => rule.min(0).max(360),
    }),
    defineField({
      name: 'headingFont',
      title: 'Heading Font',
      type: 'string',
      options: {
        list: Object.values(FONT_CHOICE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'bodyFont',
      title: 'Body Font',
      type: 'string',
      options: {
        list: Object.values(FONT_CHOICE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'radiusScale',
      title: 'Radius Scale',
      type: 'string',
      options: {
        list: Object.values(RADIUS_SCALE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'density',
      title: 'Density',
      type: 'string',
      options: {
        list: Object.values(DENSITY).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
  ],
});
