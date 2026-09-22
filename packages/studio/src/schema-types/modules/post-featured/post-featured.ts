import { POST_SOURCE, type TPostSource } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { alignmentFields } from '@blog/studio/schema-types/fields/alignment-fields/alignment-fields';
import { brandVariantField } from '@blog/studio/schema-types/fields/brand-variant-field/brand-variant-field';
import { displayModeField } from '@blog/studio/schema-types/fields/display-mode-field/display-mode-field';
import { showImagesField } from '@blog/studio/schema-types/fields/show-images-field/show-images-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { publishedPostFilter } from '@blog/studio/schema-types/filters/published-post';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { layoutField } from '@blog/studio/schema-types/objects/layout/layout-field';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';
import { validateNewestFeaturedHasCandidate } from '@blog/studio/schema-types/validation/validate-newest-featured-has-candidate/validate-newest-featured-has-candidate';
import { toTitleCase } from '@blog/utils/primitives';
import { Pin } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const POSTS_FIELDSET = 'posts';

type TPostFeaturedDocument = {
  postSource?: TPostSource;
  posts?: { _ref?: string }[];
};

export const postFeaturedSchema = defineType({
  name: 'module_postFeatured',
  title: 'Featured Posts',
  type: 'document',
  description:
    'A spotlight on up to three posts, with the first shown larger as the lead. Pin the posts yourself, or let it pick the newest ones marked Featured.',
  icon: Pin,
  validation: (rule) => [
    rule.custom(validateNewestFeaturedHasCandidate('spotlight')),
  ],
  fieldsets: [
    {
      name: POSTS_FIELDSET,
      title: 'Posts',
      description: 'Which posts this spotlight features.',
    },
  ],
  fields: [
    titleField(),
    brandVariantField(),
    headingBlockField(),
    defineField({
      name: 'postSource',
      title: 'Source',
      type: 'string',
      fieldset: POSTS_FIELDSET,
      description:
        'Specific posts you pin, or the newest posts marked Featured.',
      options: {
        layout: 'dropdown',
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
      title: 'Pinned Posts',
      type: 'array',
      fieldset: POSTS_FIELDSET,
      description: 'In display order — the first is the lead post.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: PAGE_POST_TYPE }],
          options: { filter: publishedPostFilter },
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
      fieldset: POSTS_FIELDSET,
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
    showImagesField(),
    displayModeField(),
    ...alignmentFields([], {
      title: 'Heading Alignment',
      description: 'Horizontal alignment of the heading and supporting text.',
    }),
    layoutField,
  ],
  preview: {
    select: {
      title: 'title',
      brandVariant: 'brandVariant',
      postSource: 'postSource',
      posts: 'posts',
      limit: 'limit',
    },
    prepare({ title, brandVariant, postSource, posts, limit }) {
      const pinnedCount = Array.isArray(posts) ? posts.length : 0;

      return {
        title: title ?? 'Unknown',
        subtitle: moduleSubtitle(
          brandVariant,
          postSource === POST_SOURCE.PINNED
            ? `Pinned: ${String(pinnedCount)} post${pinnedCount === 1 ? '' : 's'}`
            : `Newest featured (limit ${String(limit ?? 3)})`,
        ),
      };
    },
  },
});
