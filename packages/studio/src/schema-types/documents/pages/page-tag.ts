import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/components/slug-url-preview-input';
import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/page-tag-type';
import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { heroField } from '@blog/studio/schema-types/helpers/hero-field';
import { slugField } from '@blog/studio/schema-types/helpers/slug-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
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

const HERO_OR_HEADING_ERROR = 'Add a hero or a heading';
const HERO_HIDES_HEADING_WARNING = 'The hero hides the heading';

type TTagPageDocument = {
  hero?: { _ref?: string };
  headingBlock?: { heading?: string };
  tag?: { _ref?: string };
};

const asTagPageDocument = (
  document: SanityDocument | undefined,
): TTagPageDocument | undefined => document as TTagPageDocument | undefined;

const hasHero = (document: SanityDocument | undefined): boolean =>
  Boolean(asTagPageDocument(document)?.hero?._ref);

const hasHeading = (document: SanityDocument | undefined): boolean =>
  Boolean(asTagPageDocument(document)?.headingBlock?.heading);

/**
 * The referenced tag's own title satisfies the hero-or-heading requirement
 * — a Tag Page can render its h1 from the tag alone, so only a page with
 * neither a hero, a heading, nor a resolvable tag title errors.
 */
const validateTagHeroOrHeading = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  if (hasHero(document) || hasHeading(document)) return true;

  const tagRef = asTagPageDocument(document)?.tag?._ref;

  if (!tagRef) return HERO_OR_HEADING_ERROR;

  const client = getDraftsClient(context);

  const tagTitle = await client.fetch<string | null>(`*[_id == $id][0].title`, {
    id: tagRef,
  });

  return tagTitle ? true : HERO_OR_HEADING_ERROR;
};

const validateHeroHidesHeading = (
  document: SanityDocument | undefined,
): string | true =>
  hasHero(document) && hasHeading(document) ? HERO_HIDES_HEADING_WARNING : true;

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

const getOwnPostListRef = (
  document: SanityDocument | undefined,
): string | undefined =>
  getPostListModuleRefs(document)[0] ??
  (document as { postList?: { _ref?: string } } | undefined)?.postList?._ref;

/**
 * Rejects a second `page_tag` referencing an already-used `module_postList`
 * — `posts.query.ts` correlates a postList back to its owning page_tag via
 * an unindexed lookup, which would pick an arbitrary owner if two pages
 * shared one list. Reads the reference from either `modules[]` or the
 * deprecated `postList` field, and matches a conflicting page the same way,
 * since both shapes coexist until a later migration drops `postList`.
 */
const validateUniquePostListReference = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const postListRef = getOwnPostListRef(document);

  if (!postListRef) return true;

  const publishedId = document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = getDraftsClient(context);

  const conflictingCount = await client.fetch<number>(
    `count(*[_type == $type && (postList._ref == $postListId || $postListId in modules[]._ref) && !(_id in [$publishedId, "drafts." + $publishedId])])`,
    { type: PAGE_TAG_TYPE, postListId: postListRef, publishedId },
  );

  return conflictingCount > 0 ? POST_LIST_UNIQUENESS_ERROR : true;
};

export const pageTagSchema = defineType({
  name: PAGE_TAG_TYPE,
  title: 'Tag Page',
  type: 'document',
  icon: Tag,
  validation: (rule) => [
    rule.custom(validateTagHeroOrHeading),
    rule.custom(validateHeroHidesHeading).warning(),
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
      description:
        'The page heading (h1) and its optional supporting line. Not shown when a hero is set.',
    }),
    heroField(),
    defineModulesField({
      allow: [
        postListSchema.name,
        postLatestSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
      ],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Tag page meta title, description, and social sharing image.',
    }),
    defineField({
      name: 'postList',
      title: 'Post List',
      type: 'reference',
      description:
        'Superseded by the module_postList reference now folded into modules[].',
      to: [{ type: postListSchema.name }],
      readOnly: true,
      deprecated: {
        reason:
          'Superseded by module_postList in modules[]. Left in place so already-deployed code keeps reading it until a follow-up migration drops it.',
      },
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
