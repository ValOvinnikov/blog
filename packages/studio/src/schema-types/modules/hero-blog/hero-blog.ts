import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  HERO_IMAGE_SOURCE,
  POST_SOURCE,
  HERO_VARIANT,
  type THeroImageSource,
  type TPostSource,
  type THeroVariant,
} from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { heroFields } from '@blog/studio/schema-types/fields/hero-fields/hero-fields';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { ctaActionSchema } from '@blog/studio/schema-types/objects/action-group/action-group';
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

export const heroBlogSchema = defineType({
  name: 'module_heroBlog',
  title: 'Blog Hero',
  type: 'document',
  description:
    'A hero built around one blog post — pinned or the newest featured — with its image, heading, and a link to read it.',
  icon: Star,
  validation: (rule) => [
    rule.custom(validateNewestFeaturedHasCandidate('hero')),
    rule.custom(validateVariantRequiresImage),
    rule.custom(validatePinnedPostPublishDate).warning(),
    rule.custom(validatePostImageFallback).warning(),
  ],
  fields: [
    titleField(),
    defineField({
      name: 'postSource',
      title: 'Post Source',
      type: 'string',
      description:
        'Which post this hero renders: a specific pinned post, or the newest post marked Featured.',
      options: {
        layout: 'radio',
        list: Object.values(POST_SOURCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: POST_SOURCE.PINNED,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      description: 'The pinned post this hero renders.',
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
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description:
        "Optional kicker label. Empty renders the resolved post's topic title.",
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: "Empty renders the resolved post's title.",
      validation: (rule) => rule.max(120),
    }),
    defineField({
      name: 'supportingText',
      title: 'Supporting Text',
      type: 'text',
      rows: 3,
      description: "Empty renders the resolved post's excerpt.",
    }),
    defineField({
      name: 'imageSource',
      title: 'Image Source',
      type: 'string',
      description: "Where this hero's image comes from.",
      options: {
        layout: 'radio',
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
      title: 'Image',
      type: imageWithAltSchema.name,
      description: 'Custom image, used when Image Source is Custom.',
      hidden: ({ parent }) =>
        (parent as THeroBlogDocument | undefined)?.imageSource !==
        HERO_IMAGE_SOURCE.CUSTOM,
      validation: (rule) =>
        rule.custom((value, context) => {
          const parent = context.parent as THeroBlogDocument | undefined;

          return parent?.imageSource === HERO_IMAGE_SOURCE.CUSTOM && !value
            ? 'Custom image is required when Image Source is Custom.'
            : true;
        }),
    }),
    defineField({
      name: 'primaryActionLabel',
      title: 'Primary Action Label',
      type: 'string',
      description:
        'Empty renders "Read more". The link always targets the resolved post.',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'primaryActionAppearance',
      title: 'Primary Action Appearance',
      type: 'string',
      description:
        'How the primary action looks: Contained (filled button) or Inline (text link).',
      options: {
        layout: 'radio',
        list: Object.values(CTA_ACTION_APPEARANCE).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      initialValue: CTA_ACTION_APPEARANCE.CONTAINED,
    }),
    defineField({
      name: 'secondaryAction',
      title: 'Secondary Action',
      type: ctaActionSchema.name,
      description:
        'Optional secondary action shown next to the primary action. Must use the Secondary variant.',
      validation: (rule) =>
        rule.custom((value) => {
          const action = value as { variant?: string } | undefined;

          return action && action.variant !== CTA_ACTION_VARIANT.SECONDARY
            ? 'Secondary Action must use the Secondary variant.'
            : true;
        }),
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
