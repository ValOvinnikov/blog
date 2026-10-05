import {
  CTA_ACTION_APPEARANCE,
  POST_SOURCE,
  type TPostSource,
  FULL_BRAND_VARIANT_LIST,
} from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { heroContentPositionFields } from '@blog/studio/schema-types/fields/hero-content-position-fields/hero-content-position-fields';
import {
  heroMediaOrderSplitField,
  heroMediaOrderStackedField,
} from '@blog/studio/schema-types/fields/hero-media-order-fields/hero-media-order-fields';
import { heroVariantField } from '@blog/studio/schema-types/fields/hero-variant-field/hero-variant-field';
import { localizedOneLineTextField } from '@blog/studio/schema-types/fields/localized-one-line-text-field/localized-one-line-text-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { publishedPostFilter } from '@blog/studio/schema-types/filters/published-post';
import { heroFieldsets } from '@blog/studio/schema-types/modules/hero-fieldsets/hero-fieldsets';
import { ctaSecondaryButtonSchema } from '@blog/studio/schema-types/objects/cta-button/cta-button';
import { heroLayoutField } from '@blog/studio/schema-types/objects/hero-layout/hero-layout-field';
import { localizedImageWithAltSchema } from '@blog/studio/schema-types/objects/localized-image-with-alt/localized-image-with-alt';
import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import { validateLocalizedMaxLength } from '@blog/studio/schema-types/validation/validate-localized-max-length/validate-localized-max-length';
import { validateNewestFeaturedHasCandidate } from '@blog/studio/schema-types/validation/validate-newest-featured-has-candidate/validate-newest-featured-has-candidate';
import { toTitleCase } from '@blog/utils/primitives';
import { Star } from 'lucide-react';
import { defineField, defineType } from 'sanity';

type THeroBlogDocument = {
  postSource?: TPostSource;
  post?: { _ref?: string };
};

const FIELDSET_POST = 'post';
const FIELDSET_PRIMARY_ACTION = 'primaryAction';
const PRIMARY_ACTION_LABEL_MAX_LENGTH = 40;

export const heroBlogSchema = defineType({
  name: 'module_heroBlog',
  title: 'Blog Hero',
  type: 'document',
  description:
    'A hero built around one blog post — pinned or the newest featured — with its image, heading, and a link to read it.',
  icon: Star,
  fieldsets: [
    {
      name: FIELDSET_POST,
      title: 'Post',
      description: 'Which post this hero features.',
    },
    {
      name: FIELDSET_PRIMARY_ACTION,
      title: 'Primary Action',
      description: 'The main action. It always links to the featured post.',
      options: { collapsible: true, collapsed: false },
    },
    ...heroFieldsets,
  ],
  fields: [
    titleField(),
    brandVariantField({ list: FULL_BRAND_VARIANT_LIST }),
    defineField({
      name: 'postSource',
      title: 'Source',
      type: 'string',
      description:
        'A specific post you pin, or the newest post marked Featured.',
      fieldset: FIELDSET_POST,
      options: {
        layout: 'dropdown',
        list: Object.values(POST_SOURCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: POST_SOURCE.NEWEST_FEATURED,
      validation: (rule) =>
        rule.required().custom(validateNewestFeaturedHasCandidate('hero')),
    }),
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      description: 'The pinned post.',
      fieldset: FIELDSET_POST,
      to: [{ type: PAGE_POST_TYPE }],
      options: { filter: publishedPostFilter },
      hidden: ({ parent }) =>
        (parent as THeroBlogDocument | undefined)?.postSource !==
        POST_SOURCE.PINNED,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as THeroBlogDocument | undefined;

          return parent?.postSource === POST_SOURCE.PINNED && !value
            ? 'Choose a post, or switch the source to Newest featured.'
            : true;
        }),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: localizedImageWithAltSchema.name,
      description:
        "Upload an image to use it here. Falls back to the post's own hero image when left empty.",
    }),
    localizedOneLineTextField({
      name: 'eyebrow',
      title: 'Eyebrow',
      description:
        "Short line above the heading, per language. Defaults to the post's topic.",
    }),
    localizedOneLineTextField({
      name: 'primaryActionLabel',
      title: 'Label',
      description: 'Text of the action, per language.',
      fieldset: FIELDSET_PRIMARY_ACTION,
      validation: (rule) => [
        rule.custom(validateDefaultLanguageFilled('Give the action a label.')),
        rule.custom(
          validateLocalizedMaxLength(
            PRIMARY_ACTION_LABEL_MAX_LENGTH,
            `Keep the label under ${PRIMARY_ACTION_LABEL_MAX_LENGTH} characters.`,
          ),
        ),
      ],
    }),
    defineField({
      name: 'primaryActionAppearance',
      title: 'Appearance',
      type: 'string',
      description: 'How the action is styled.',
      fieldset: FIELDSET_PRIMARY_ACTION,
      options: {
        layout: 'dropdown',
        list: Object.values(CTA_ACTION_APPEARANCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_ACTION_APPEARANCE.CONTAINED,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'secondaryAction',
      title: 'Secondary Action',
      type: ctaSecondaryButtonSchema.name,
      description:
        'An optional supporting action. Leave the link empty to show none.',
      options: { collapsible: true, collapsed: true },
    }),
    heroVariantField(),
    ...heroContentPositionFields(),
    heroMediaOrderSplitField(),
    heroMediaOrderStackedField(),
    heroLayoutField,
  ],
  preview: {
    select: {
      title: 'title',
      postSource: 'postSource',
      postTitle: 'post.title',
    },
    prepare({ title, postSource, postTitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle:
          postSource === POST_SOURCE.PINNED
            ? `Pinned: ${String(postTitle ?? 'no post chosen')}`
            : 'Newest featured post',
      };
    },
  },
});
