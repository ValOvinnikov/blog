import { Sparkles } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type THomePageParent = {
  heroEyebrowMode?: string;
  heroTitleMode?: string;
  heroSubtitleMode?: string;
  heroImageMode?: string;
};

const isMode = (parent: unknown, key: keyof THomePageParent, mode: string) =>
  (parent as THomePageParent | undefined)?.[key] === mode;

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
        'Post featured in the Home hero. If empty, the newest post marked Featured is used.',
      to: [{ type: 'post' }],
      validation: (rule) =>
        rule
          .custom((value) =>
            value
              ? true
              : 'Recommended for predictable Home hero content. If empty, the site uses the newest post marked Featured.',
          )
          .warning('Choose a featured post for predictable Home hero content.'),
    }),
    defineField({
      name: 'heroEyebrowMode',
      title: 'Hero Eyebrow Source',
      type: 'string',
      description:
        'Use the selected/fallback featured post category or provide custom text.',
      options: {
        layout: 'radio',
        list: [
          { title: 'Use post category', value: 'postCategory' },
          { title: 'Custom', value: 'custom' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroEyebrow',
      title: 'Custom Hero Eyebrow',
      type: 'string',
      hidden: ({ parent }) => !isMode(parent, 'heroEyebrowMode', 'custom'),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isMode(context.parent, 'heroEyebrowMode', 'custom') && !value) {
            return 'Custom eyebrow is required when Hero Eyebrow Source is Custom.';
          }

          return true;
        }),
    }),
    defineField({
      name: 'heroTitleMode',
      title: 'Hero Title Source',
      type: 'string',
      description:
        'Use the selected/fallback featured post title or provide custom text.',
      options: {
        layout: 'radio',
        list: [
          { title: 'Use post title', value: 'postTitle' },
          { title: 'Custom', value: 'custom' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroTitle',
      title: 'Custom Hero Title',
      type: 'string',
      hidden: ({ parent }) => !isMode(parent, 'heroTitleMode', 'custom'),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isMode(context.parent, 'heroTitleMode', 'custom') && !value) {
            return 'Custom title is required when Hero Title Source is Custom.';
          }

          return true;
        }),
    }),
    defineField({
      name: 'heroSubtitleMode',
      title: 'Hero Subtitle Source',
      type: 'string',
      description:
        'Use the selected/fallback featured post excerpt or provide custom text.',
      options: {
        layout: 'radio',
        list: [
          { title: 'Use post excerpt', value: 'postExcerpt' },
          { title: 'Custom', value: 'custom' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Custom Hero Subtitle',
      type: 'text',
      rows: 3,
      hidden: ({ parent }) => !isMode(parent, 'heroSubtitleMode', 'custom'),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isMode(context.parent, 'heroSubtitleMode', 'custom') && !value) {
            return 'Custom subtitle is required when Hero Subtitle Source is Custom.';
          }

          return true;
        }),
    }),
    defineField({
      name: 'heroImageMode',
      title: 'Hero Image Source',
      type: 'string',
      description:
        'Use the selected/fallback featured post image, provide a custom image, or hide the image.',
      options: {
        layout: 'radio',
        list: [
          { title: 'Use post image', value: 'postImage' },
          { title: 'Custom', value: 'custom' },
          { title: 'No image', value: 'none' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'heroImage',
      title: 'Custom Hero Image',
      type: 'imageWithAlt',
      hidden: ({ parent }) => !isMode(parent, 'heroImageMode', 'custom'),
      validation: (rule) =>
        rule.custom((value, context) => {
          if (isMode(context.parent, 'heroImageMode', 'custom') && !value) {
            return 'Custom image is required when Hero Image Source is Custom.';
          }

          return true;
        }),
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
