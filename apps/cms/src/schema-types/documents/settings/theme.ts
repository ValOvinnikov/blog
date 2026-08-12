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
      description:
        'The starting look for the whole site — colors, fonts, corner roundness, and spacing. Every setting below is an optional override on top of this preset: leave one blank and it falls back to whatever this preset uses by default.',
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
      description:
        "Sets the site's main accent color (links, buttons, highlights) by picking a position on the color wheel, from 0 to 360. For reference: roughly 250 is blue, 30 is orange/amber, 140 is green, 340 is pink. Leave blank to use the preset's own accent color.",
      validation: (rule) => rule.min(0).max(360),
    }),
    defineField({
      name: 'logoHue',
      title: 'Logo Hue',
      type: 'number',
      description:
        'Same color-wheel idea as Accent Hue (0-360), but only for the logo mark, so it can stand apart from the rest of the accent color. Leave blank to make the logo match Accent Hue.',
      validation: (rule) => rule.min(0).max(360),
    }),
    defineField({
      name: 'headingFont',
      title: 'Heading Font',
      type: 'string',
      description:
        "The typeface used for titles and headings across the site. Leave blank to use the preset's default heading font.",
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
      description:
        "The typeface used for paragraph and body text across the site. Leave blank to use the preset's default body font.",
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
      description:
        "How rounded corners look on buttons, cards, and other boxes across the site, from sharp/square edges to very rounded. Leave blank to use the preset's default.",
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
      description:
        "How tightly spaced the overall layout feels — a more compact density fits more content on screen, a looser one adds breathing room. Leave blank to use the preset's default.",
      options: {
        list: Object.values(DENSITY).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
  ],
});
