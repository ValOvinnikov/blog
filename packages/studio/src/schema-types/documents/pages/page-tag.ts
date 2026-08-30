import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/components/slug-url-preview-input';
import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/page-tag-type';
import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { Tag } from 'lucide-react';
import { defineField, defineType, type ValidationContext } from 'sanity';

const tagSlugUrlPreviewInput = createSlugUrlPreviewInput('/tags/');

type TReferenceValue = { _ref?: string } | undefined;

/**
 * Rejects a second `page_tag` referencing an already-covered `blog_tag` —
 * `/tags/{slug}` would otherwise be ambiguous. `perspective: 'drafts'` so an
 * unpublished conflicting page still counts.
 */
const validateUniqueTagReference = async (
  value: TReferenceValue,
  context: ValidationContext,
): Promise<string | true> => {
  if (!value?._ref) return true;

  const publishedId = context.document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = getDraftsClient(context);

  const conflictingCount = await client.fetch<number>(
    `count(*[_type == $type && tag._ref == $tagId && !(_id in [$publishedId, "drafts." + $publishedId])])`,
    { type: PAGE_TAG_TYPE, tagId: value._ref, publishedId },
  );

  return conflictingCount > 0
    ? 'Another Tag Page already references this tag — each tag can only back one Tag Page.'
    : true;
};

/**
 * Rejects a second `page_tag` referencing an already-used `module_postList`
 * — `posts.query.ts` correlates a postList back to its owning page_tag via
 * an unindexed lookup, which would pick an arbitrary owner if two pages
 * shared one list. Mirrors `validateUniqueTagReference` exactly.
 */
const validateUniquePostListReference = async (
  value: TReferenceValue,
  context: ValidationContext,
): Promise<string | true> => {
  if (!value?._ref) return true;

  const publishedId = context.document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = getDraftsClient(context);

  const conflictingCount = await client.fetch<number>(
    `count(*[_type == $type && postList._ref == $postListId && !(_id in [$publishedId, "drafts." + $publishedId])])`,
    { type: PAGE_TAG_TYPE, postListId: value._ref, publishedId },
  );

  return conflictingCount > 0
    ? 'Another Tag Page already references this Post List — each Post List can only back one Tag Page.'
    : true;
};

export const pageTagSchema = defineType({
  name: PAGE_TAG_TYPE,
  title: 'Tag Page',
  type: 'document',
  icon: Tag,
  fields: [
    titleField(),
    // Sanity's default slug `isUnique` check — scoped to this document type
    // — is exactly the scope this field needs: /tags/{slug} collisions only
    // matter within page_tag itself, never against page_generic's /{slug}.
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
      components: { input: tagSlugUrlPreviewInput },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tag',
      title: 'Tag',
      type: 'reference',
      description: 'The tag this page represents.',
      to: [{ type: tagSchema.name }],
      validation: (rule) => rule.required().custom(validateUniqueTagReference),
    }),
    defineField({
      name: 'postList',
      title: 'Post List',
      type: 'reference',
      description:
        'The paginated post archive, scoped to this tag, rendered on this page.',
      to: [{ type: postListSchema.name }],
      validation: (rule) => rule.custom(validateUniquePostListReference),
    }),
    defineModulesField({
      allow: [postLatestSchema.name, ctaSchema.name, newsletterSchema.name],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Tag page meta title, description, and social sharing image.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      tagTitle: 'tag.title',
    },
    prepare({ title, tagTitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: tagTitle ? `Tag: ${String(tagTitle)}` : undefined,
      };
    },
  },
});
