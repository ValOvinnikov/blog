import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { getDraftsClient } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { Tag } from 'lucide-react';
import {
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

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

const MULTIPLE_POST_LIST_ERROR =
  'Only one Post List module is allowed per page.';
const NO_POST_LIST_WARNING =
  'This page has no Post List module — the archive will be empty until one is added.';

type TModuleReference = { _type?: string; _ref?: string };

const getPostListModuleRefs = (
  document: SanityDocument | undefined,
): string[] =>
  ((document as { modules?: TModuleReference[] } | undefined)?.modules ?? [])
    .filter((module) => module._type === postListSchema.name)
    .map((module) => module._ref)
    .filter((ref): ref is string => Boolean(ref));

const validateSinglePostListModule = (
  document: SanityDocument | undefined,
): string | true =>
  getPostListModuleRefs(document).length > 1 ? MULTIPLE_POST_LIST_ERROR : true;

const validateHasPostListModule = (
  document: SanityDocument | undefined,
): string | true =>
  getPostListModuleRefs(document).length === 0 ? NO_POST_LIST_WARNING : true;

const POST_LIST_UNIQUENESS_ERROR =
  'Another Tag Page already references this Post List — each Post List can only back one Tag Page.';

/**
 * Rejects a second `page_tag` referencing an already-used `module_postList`
 * — `posts.query.ts` correlates a postList back to its owning page_tag via
 * an unindexed lookup, which would pick an arbitrary owner if two pages
 * shared one list.
 */
const validateUniquePostListReference = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const postListRef = getPostListModuleRefs(document)[0];

  if (!postListRef) return true;

  const publishedId = document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = getDraftsClient(context);

  const conflictingCount = await client.fetch<number>(
    `count(*[_type == $type && $postListId in modules[]._ref && !(_id in [$publishedId, "drafts." + $publishedId])])`,
    { type: PAGE_TAG_TYPE, postListId: postListRef, publishedId },
  );

  return conflictingCount > 0 ? POST_LIST_UNIQUENESS_ERROR : true;
};

export const tagPageSchema = defineType({
  name: PAGE_TAG_TYPE,
  title: 'Tag Page',
  type: 'document',
  icon: Tag,
  validation: (rule) => [
    rule.custom(validateSinglePostListModule),
    rule.custom(validateHasPostListModule).warning(),
    rule.custom(validateUniquePostListReference),
  ],
  fields: [
    titleField(),
    // Sanity's default slug `isUnique` check — scoped to this document type
    // — is exactly the scope this field needs: /tags/{slug} collisions only
    // matter within page_tag itself, never against page_landing's /{slug}.
    // No custom `isUnique` override is needed on top of it.
    slugField({
      description: 'URL path segment — auto-generated from title.',
      previewInput: tagSlugUrlPreviewInput,
    }),
    defineField({
      name: 'tag',
      title: 'Tag',
      type: 'reference',
      description: 'The tag this page represents.',
      to: [{ type: tagSchema.name }],
      validation: (rule) => rule.required().custom(validateUniqueTagReference),
    }),
    headingBlockField({
      requireHeading: true,
      description:
        "The page heading, shown as the page's H1. Hidden when a hero is set — the hero's heading becomes the H1 instead. Still required, so the page keeps a heading if the hero is ever removed.",
    }),
    heroField(),
    modulesField({
      allow: [
        postListSchema.name,
        postLatestSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
      ],
    }),
    seoField(),
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
