import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/components/slug-url-preview-input';
import { authorSchema } from '@blog/studio/schema-types/documents/blog/author';
import { postSchema } from '@blog/studio/schema-types/documents/blog/post';
import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/page-post-type';
import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import { slugField } from '@blog/studio/schema-types/helpers/slug-field';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/helpers/validate-single-blank-heading-per-type';
import { contentSchema } from '@blog/studio/schema-types/modules/module-content';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/module-post-related';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt';
import { richTextSchema } from '@blog/studio/schema-types/objects/rich-text';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { skimSchema } from '@blog/studio/schema-types/objects/skim';
import { Newspaper } from 'lucide-react';
import {
  defineArrayMember,
  defineField,
  defineType,
  type ValidationContext,
} from 'sanity';

const postSlugUrlPreviewInput = createSlugUrlPreviewInput('/blog/');

type TPostReferenceValue = { _ref?: string } | undefined;

/**
 * Rejects a second `page_post` referencing an already-covered `blog_post`
 * — `/blog/{slug}` would otherwise be ambiguous. `perspective: 'drafts'`
 * so an unpublished conflicting page still counts.
 */
const validateUniquePostReference = async (
  value: TPostReferenceValue,
  context: ValidationContext,
): Promise<string | true> => {
  if (!value?._ref) return true;

  const publishedId = context.document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = getDraftsClient(context);

  const conflictingCount = await client.fetch<number>(
    `count(*[_type == $type && post._ref == $postId && !(_id in [$publishedId, "drafts." + $publishedId])])`,
    { type: PAGE_POST_TYPE, postId: value._ref, publishedId },
  );

  return conflictingCount > 0
    ? 'Another Post Page already references this post — each post can only back one Post Page.'
    : true;
};

export const pagePostSchema = defineType({
  name: PAGE_POST_TYPE,
  title: 'Post Page',
  type: 'document',
  icon: Newspaper,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The headline displayed on the post page and in cards.',
      validation: (rule) => rule.required().max(120),
    }),
    // Sanity's default slug `isUnique` check — scoped to this document type
    // — is exactly the scope this field needs: /blog/{slug} collisions only
    // matter within page_post itself, never against page_landing's /{slug}.
    // No custom `isUnique` override is needed on top of it.
    slugField({
      description: 'URL path segment — auto-generated from title.',
      previewInput: postSlugUrlPreviewInput,
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      description:
        'Short summary shown in cards, meta description, and RSS feed.',
      validation: (rule) => rule.required().min(50).max(300),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: imageWithAltSchema.name,
      description:
        'Optional hero image shown at the top of the post and in social shares.',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      description: 'The person who wrote this post.',
      to: [{ type: authorSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'topic',
      title: 'Topic',
      type: 'reference',
      description: "The post's primary topic classification.",
      to: [{ type: topicSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      description:
        'Topics for discovery — power /tag pages, related posts, and the article footer chips.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: tagSchema.name }],
        }),
      ],
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      description: 'Controls sort order and the date shown to readers.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: richTextSchema.name,
      description:
        'Full post content — supports rich text, images, and code blocks.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description:
        'Marks this post for the Newest featured source of the blog hero and the featured spotlight.',
    }),
    defineField({
      name: 'skim',
      title: 'Skim',
      type: skimSchema.name,
      description:
        '30-second-skim takeaways for the choose-your-depth reading experience.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Post page meta title, description, and social sharing image.',
    }),
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      description: 'The post this page represents.',
      to: [{ type: postSchema.name }],
      validation: (rule) => rule.custom(validateUniquePostReference),
    }),
    defineModulesField({
      allow: [
        postRelatedSchema.name,
        newsletterSchema.name,
        ctaSchema.name,
        contentSchema.name,
      ],
      validateCustom: (rule) =>
        rule.custom(
          validateSingleBlankHeadingPerType([postRelatedSchema.name]),
        ),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'heroImage',
    },
    prepare({ title, author, media }) {
      return {
        title: title ?? 'Unknown',
        subtitle: author ? `by ${String(author)}` : '',
        media,
      };
    },
  },
});
