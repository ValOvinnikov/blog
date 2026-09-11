import { POST_SOURCE, type TPostSource } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { brandVariantField } from '@blog/studio/schema-types/helpers/brand-variant-field';
import { defineAlignmentFields } from '@blog/studio/schema-types/helpers/define-alignment-fields';
import { displayModeField } from '@blog/studio/schema-types/helpers/display-mode-field';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/helpers/layout-field';
import { showImagesField } from '@blog/studio/schema-types/helpers/show-images-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { validateNewestFeaturedHasCandidate } from '@blog/studio/schema-types/helpers/validate-newest-featured-has-candidate';
import { toTitleCase } from '@blog/utils/primitives';
import { Pin } from 'lucide-react';
import {
  defineArrayMember,
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

type TPostFeaturedDocument = {
  postSource?: TPostSource;
  posts?: { _ref?: string }[];
};

const asPostFeaturedDocument = (
  document: SanityDocument | undefined,
): TPostFeaturedDocument | undefined =>
  document as TPostFeaturedDocument | undefined;

const validatePinnedPostsPublishDate = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const doc = asPostFeaturedDocument(document);

  if (doc?.postSource !== POST_SOURCE.PINNED) return true;

  const refs = (doc.posts ?? [])
    .map((post) => post._ref)
    .filter((ref): ref is string => Boolean(ref));

  if (refs.length === 0) return true;

  const client = getDraftsClient(context);
  const resolved = await client.fetch<{ publishedAt: string | null }[]>(
    `*[_id in $ids]{ publishedAt }`,
    { ids: refs },
  );

  const hasFuturePost = resolved.some(
    (post) => post.publishedAt && new Date(post.publishedAt) > new Date(),
  );

  return hasFuturePost
    ? 'This post publishes later. The spotlight skips it until then.'
    : true;
};

export const postFeaturedSchema = defineType({
  name: 'module_postFeatured',
  title: 'Post Featured',
  type: 'document',
  icon: Pin,
  validation: (rule) => [
    rule.custom(validateNewestFeaturedHasCandidate('spotlight')),
    rule.custom(validatePinnedPostsPublishDate).warning(),
  ],
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField({ requireHeading: true }),
    showImagesField(),
    displayModeField(),
    defineField({
      name: 'postSource',
      title: 'Post Source',
      type: 'string',
      description:
        'Which posts this spotlight renders: specific pinned posts, or the newest posts marked Featured.',
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
      name: 'posts',
      title: 'Posts',
      type: 'array',
      description:
        'Pinned posts, in display order — the first is the lead post.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: PAGE_POST_TYPE }],
        }),
      ],
      hidden: ({ parent }) =>
        (parent as TPostFeaturedDocument | undefined)?.postSource !==
        POST_SOURCE.PINNED,
      validation: (rule) =>
        rule
          .unique()
          .max(3)
          .error('A spotlight holds at most three posts.')
          .custom((value, context) => {
            const parent = context.parent as TPostFeaturedDocument | undefined;

            return parent?.postSource === POST_SOURCE.PINNED &&
              (!value || value.length === 0)
              ? 'Pin at least one post, or switch the source to Newest featured.'
              : true;
          }),
    }),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Maximum number of newest featured posts to show.',
      initialValue: 3,
      hidden: ({ parent }) =>
        (parent as TPostFeaturedDocument | undefined)?.postSource !==
        POST_SOURCE.NEWEST_FEATURED,
      validation: (rule) =>
        rule
          .integer()
          .min(1)
          .max(3)
          .custom((value, context) => {
            const parent = context.parent as TPostFeaturedDocument | undefined;

            return parent?.postSource === POST_SOURCE.NEWEST_FEATURED && !value
              ? 'Limit is required, or switch the source to Pinned.'
              : true;
          }),
    }),
    ...defineAlignmentFields([]),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      postSource: 'postSource',
      posts: 'posts',
      limit: 'limit',
    },
    prepare({ title, postSource, posts, limit }) {
      const pinnedCount = Array.isArray(posts) ? posts.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle:
          postSource === POST_SOURCE.PINNED
            ? `Pinned: ${String(pinnedCount)} post${pinnedCount === 1 ? '' : 's'}`
            : `Newest featured (limit ${String(limit ?? 3)})`,
      };
    },
  },
});
