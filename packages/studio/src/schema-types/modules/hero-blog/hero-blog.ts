import {
  CTA_ACTION_APPEARANCE,
  HERO_IMAGE_SOURCE,
  POST_SOURCE,
  HERO_VARIANT,
  type THeroImageSource,
  type TPostSource,
  type THeroVariant,
  FULL_BRAND_VARIANT_LIST,
} from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import {
  heroFields,
  heroFieldsets,
} from '@blog/studio/schema-types/fields/hero-fields/hero-fields';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { ctaSecondaryButtonSchema } from '@blog/studio/schema-types/objects/cta-button/cta-button';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { getDraftsClient } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import {
  PUBLISHED_POST_CONDITION,
  validateNewestFeaturedHasCandidate,
} from '@blog/studio/schema-types/validation/validate-newest-featured-has-candidate/validate-newest-featured-has-candidate';
import { toTitleCase } from '@blog/utils/primitives';
import { Star } from 'lucide-react';
import {
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

type THeroBlogDocument = {
  postSource?: TPostSource;
  post?: { _ref?: string };
  imageSource?: THeroImageSource;
  variant?: THeroVariant;
};

type TResolvedPost = {
  publishedAt: string | null;
  heroImage: unknown;
};

const asHeroBlogDocument = (
  document: SanityDocument | undefined,
): THeroBlogDocument | undefined => document as THeroBlogDocument | undefined;

const fetchResolvedPost = async (
  document: THeroBlogDocument,
  context: ValidationContext,
): Promise<TResolvedPost | null> => {
  const client = getDraftsClient(context);

  if (document.postSource === POST_SOURCE.PINNED) {
    const ref = document.post?._ref;

    if (!ref) return null;

    return client.fetch<TResolvedPost | null>(
      `*[_id == $id][0]{ publishedAt, heroImage }`,
      { id: ref },
    );
  }

  return client.fetch<TResolvedPost | null>(
    `*[_type == "${PAGE_POST_TYPE}" && featured == true && ${PUBLISHED_POST_CONDITION}] | order(publishedAt desc)[0]{ publishedAt, heroImage }`,
  );
};

const validateVariantRequiresImage = (
  document: SanityDocument | undefined,
): string | true => {
  const doc = asHeroBlogDocument(document);
  const variantNeedsImage =
    doc?.variant === HERO_VARIANT.SPLIT || doc?.variant === HERO_VARIANT.BANNER;

  return variantNeedsImage && doc?.imageSource === HERO_IMAGE_SOURCE.NONE
    ? 'These variants are built around an image.'
    : true;
};

const validatePinnedPostPublishDate = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const doc = asHeroBlogDocument(document);

  if (doc?.postSource !== POST_SOURCE.PINNED) return true;

  const resolved = await fetchResolvedPost(doc, context);

  return resolved?.publishedAt && new Date(resolved.publishedAt) > new Date()
    ? 'This post publishes later. The hero stays empty until then.'
    : true;
};

const validatePostImageFallback = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const doc = asHeroBlogDocument(document);

  if (doc?.imageSource !== HERO_IMAGE_SOURCE.POST) return true;

  const resolved = await fetchResolvedPost(doc, context);

  return resolved && !resolved.heroImage
    ? 'Falls back to no image on the page.'
    : true;
};

const FIELDSET_POST = 'post';
const FIELDSET_IMAGE = 'image';
const FIELDSET_PRIMARY_ACTION = 'primaryAction';

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
      name: FIELDSET_IMAGE,
      title: 'Image',
      description: "Where the hero's image comes from.",
    },
    {
      name: FIELDSET_PRIMARY_ACTION,
      title: 'Primary Action',
      description: 'The main action. It always links to the featured post.',
    },
    ...heroFieldsets,
  ],
  validation: (rule) => [
    rule.custom(validateNewestFeaturedHasCandidate('hero')),
    rule.custom(validateVariantRequiresImage),
    rule.custom(validatePinnedPostPublishDate).warning(),
    rule.custom(validatePostImageFallback).warning(),
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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      description: 'The pinned post.',
      fieldset: FIELDSET_POST,
      to: [{ type: PAGE_POST_TYPE }],
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
      name: 'imageSource',
      title: 'Source',
      type: 'string',
      description: "The post's own hero image, a custom image, or no image.",
      fieldset: FIELDSET_IMAGE,
      options: {
        layout: 'dropdown',
        list: Object.values(HERO_IMAGE_SOURCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: HERO_IMAGE_SOURCE.POST,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Custom Image',
      type: imageWithAltSchema.name,
      description: 'Used when Source is Custom.',
      fieldset: FIELDSET_IMAGE,
      hidden: ({ parent }) =>
        (parent as THeroBlogDocument | undefined)?.imageSource !==
        HERO_IMAGE_SOURCE.CUSTOM,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as THeroBlogDocument | undefined;

          return parent?.imageSource === HERO_IMAGE_SOURCE.CUSTOM && !value
            ? 'A custom image is required when Source is Custom.'
            : true;
        }),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description:
        "Short line above the heading. Defaults to the post's topic.",
    }),
    defineField({
      name: 'primaryActionLabel',
      title: 'Label',
      type: 'string',
      description: 'Text of the action.',
      fieldset: FIELDSET_PRIMARY_ACTION,
      validation: (rule) => rule.required().max(40),
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
    }),
    ...heroFields({ image: false }),
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
