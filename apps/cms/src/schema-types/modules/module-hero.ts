import { HERO_FIELD_MODE } from '@blog/config/constants';
import { Sparkles } from 'lucide-react';
import { defineField, defineType } from 'sanity';

import { defineModeFieldPair } from '../helpers/define-mode-field-pair';

export default defineType({
  name: 'module_hero',
  title: 'Hero',
  type: 'object',
  icon: Sparkles,
  fields: [
    defineField({
      name: 'featuredPost',
      title: 'Featured Post',
      type: 'reference',
      description:
        'Post featured in this hero. If empty, the newest post marked Featured is used.',
      to: [{ type: 'post' }],
      validation: (rule) =>
        rule
          .custom((value) =>
            value
              ? true
              : 'Recommended for predictable hero content. If empty, the site uses the newest post marked Featured.',
          )
          .warning('Choose a featured post for predictable hero content.'),
    }),
    ...defineModeFieldPair({
      name: 'heroEyebrow',
      title: 'Hero Eyebrow',
      description:
        'Use the selected/fallback featured post category or provide custom text.',
      modeOptions: [
        { title: 'Use post category', value: HERO_FIELD_MODE.POST_CATEGORY },
        { title: 'Custom', value: HERO_FIELD_MODE.CUSTOM },
      ],
    }),
    ...defineModeFieldPair({
      name: 'heroTitle',
      title: 'Hero Title',
      description:
        'Use the selected/fallback featured post title or provide custom text.',
      modeOptions: [
        { title: 'Use post title', value: HERO_FIELD_MODE.POST_TITLE },
        { title: 'Custom', value: HERO_FIELD_MODE.CUSTOM },
      ],
    }),
    ...defineModeFieldPair({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      description:
        'Use the selected/fallback featured post excerpt or provide custom text.',
      modeOptions: [
        { title: 'Use post excerpt', value: HERO_FIELD_MODE.POST_EXCERPT },
        { title: 'Custom', value: HERO_FIELD_MODE.CUSTOM },
      ],
      customType: 'text',
      rows: 3,
    }),
    ...defineModeFieldPair({
      name: 'heroImage',
      title: 'Hero Image',
      description:
        'Use the selected/fallback featured post image, provide a custom image, or hide the image.',
      modeOptions: [
        { title: 'Use post image', value: HERO_FIELD_MODE.POST_IMAGE },
        { title: 'Custom', value: HERO_FIELD_MODE.CUSTOM },
        { title: 'No image', value: HERO_FIELD_MODE.NONE },
      ],
      customType: 'imageWithAlt',
    }),
    defineField({
      name: 'primaryActionLabel',
      title: 'Primary Action Label',
      type: 'string',
      description:
        'Primary action links to the selected hero post. Defaults to "Read more".',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'secondaryAction',
      title: 'Secondary Action',
      type: 'link',
      description: 'Optional secondary CTA shown next to the primary action.',
    }),
  ],
  preview: {
    select: {
      title: 'heroTitle',
      subtitle: 'featuredPost.title',
    },
    prepare({ title, subtitle }) {
      return {
        title: (title as string | undefined) ?? 'Hero',
        subtitle: subtitle
          ? `Featured: ${String(subtitle)}`
          : 'Uses newest featured post',
      };
    },
  },
});
