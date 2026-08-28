import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/components/slug-url-preview-input';
import { postSchema } from '@blog/studio/schema-types/documents/blog/post';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/page-post-type';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { Newspaper } from 'lucide-react';
import { defineField, defineType, type ValidationContext } from 'sanity';

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
    titleField(),
    // Sanity's default slug `isUnique` check — scoped to this document type
    // — is exactly the scope this field needs: /blog/{slug} collisions only
    // matter within page_post itself, never against page_generic's /{slug}.
    // No custom `isUnique` override is needed on top of it.
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path segment — auto-generated from title.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      components: { input: postSlugUrlPreviewInput },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'post',
      title: 'Post',
      type: 'reference',
      description: 'The post this page represents.',
      to: [{ type: postSchema.name }],
      validation: (rule) => rule.required().custom(validateUniquePostReference),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      description: 'Controls sort order and the date shown to readers.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Post page meta title, description, and social sharing image.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      postTitle: 'post.title',
    },
    prepare({ title, postTitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: postTitle ? `Post: ${String(postTitle)}` : undefined,
      };
    },
  },
});
