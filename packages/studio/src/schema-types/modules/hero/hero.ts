import {
  FULL_BRAND_VARIANT_LIST,
  HERO_FIELD_MODE,
  type THeroFieldMode,
} from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { heroLayoutField } from '@blog/studio/schema-types/objects/hero-layout/hero-layout-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { linkSchema } from '@blog/studio/schema-types/objects/link/link';
import { Sparkles } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type TModeFieldPairParent = Record<string, THeroFieldMode | undefined>;

const isMode = (parent: unknown, key: string, mode: THeroFieldMode): boolean =>
  (parent as TModeFieldPairParent | undefined)?.[key] === mode;

type TModeFieldPair = {
  name: string;
  title: string;
  description: string;
  modeOptions: { title: string; value: THeroFieldMode }[];
  customType?: 'string' | 'text' | 'imageWithAlt';
  rows?: number;
};

const modeFieldPair = ({
  name,
  title,
  description,
  modeOptions,
  customType = 'string',
  rows,
}: TModeFieldPair) => {
  const modeName = `${name}Mode`;

  const hidden = ({ parent }: { parent?: unknown }) =>
    !isMode(parent, modeName, HERO_FIELD_MODE.CUSTOM);

  const requiredWhenCustom = (value: unknown, context: { parent?: unknown }) =>
    isMode(context.parent, modeName, HERO_FIELD_MODE.CUSTOM) && !value
      ? `Custom ${title.toLowerCase()} is required when ${title} Source is Custom.`
      : true;

  const customFieldDescription = `Your own ${title.toLowerCase()}, used when ${title} Source is set to Custom.`;

  const customField =
    customType === 'text'
      ? defineField({
          name,
          title: `Custom ${title}`,
          type: 'text',
          description: customFieldDescription,
          rows,
          hidden,
          validation: (rule) => rule.custom(requiredWhenCustom),
        })
      : customType === 'imageWithAlt'
        ? defineField({
            name,
            title: `Custom ${title}`,
            type: imageWithAltSchema.name,
            description: customFieldDescription,
            hidden,
            validation: (rule) => rule.custom(requiredWhenCustom),
          })
        : defineField({
            name,
            title: `Custom ${title}`,
            type: 'string',
            description: customFieldDescription,
            hidden,
            validation: (rule) => rule.custom(requiredWhenCustom),
          });

  return [
    defineField({
      name: modeName,
      title: `${title} Source`,
      type: 'string',
      description,
      options: {
        layout: 'radio',
        list: modeOptions,
      },
      validation: (rule) => rule.required(),
    }),
    customField,
  ];
};

export const heroSchema = defineType({
  name: 'module_hero',
  title: 'Hero',
  type: 'document',
  description:
    'A hero built around a featured post, pulling its image, heading, and excerpt, or letting each be overridden by hand.',
  icon: Sparkles,
  fields: [
    titleField(),
    brandVariantField({ list: FULL_BRAND_VARIANT_LIST }),
    defineField({
      name: 'featuredPost',
      title: 'Featured Post',
      type: 'reference',
      description:
        'Post featured in this hero. If empty, the newest post marked Featured is used.',
      to: [{ type: PAGE_POST_TYPE }],
      validation: (rule) =>
        rule
          .custom((value) =>
            value
              ? true
              : 'Recommended for predictable hero content. If empty, the site uses the newest post marked Featured.',
          )
          .warning('Choose a featured post for predictable hero content.'),
    }),
    ...modeFieldPair({
      name: 'heroEyebrow',
      title: 'Hero Eyebrow',
      description:
        'Use the selected/fallback featured post topic or provide custom text.',
      modeOptions: [
        { title: 'Use post topic', value: HERO_FIELD_MODE.POST_TOPIC },
        { title: 'Custom', value: HERO_FIELD_MODE.CUSTOM },
      ],
    }),
    ...modeFieldPair({
      name: 'heroTitle',
      title: 'Hero Title',
      description:
        'Use the selected/fallback featured post title or provide custom text.',
      modeOptions: [
        { title: 'Use post title', value: HERO_FIELD_MODE.POST_TITLE },
        { title: 'Custom', value: HERO_FIELD_MODE.CUSTOM },
      ],
    }),
    ...modeFieldPair({
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
    ...modeFieldPair({
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
      type: linkSchema.name,
      description: 'Optional secondary CTA shown next to the primary action.',
    }),
    heroLayoutField,
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'featuredPost.title',
    },
    prepare({ title, subtitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: subtitle
          ? `Featured: ${String(subtitle)}`
          : 'Uses newest featured post',
      };
    },
  },
});
