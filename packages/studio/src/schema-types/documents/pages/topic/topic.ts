import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import {
  headingBlockField,
  PAGE_HEADING_DESCRIPTION,
} from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { getDraftsClient } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import { Tags } from 'lucide-react';
import {
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

const topicSlugUrlPreviewInput = createSlugUrlPreviewInput('/topics/');

type TReferenceValue = { _ref?: string } | undefined;

/**
 * Rejects a second `page_topic` referencing an already-covered `blog_topic`
 * — `/topics/{slug}` would otherwise be ambiguous. `perspective: 'drafts'`
 * so an unpublished conflicting page still counts.
 */
const validateUniqueTopicReference = async (
  value: TReferenceValue,
  context: ValidationContext,
): Promise<string | true> => {
  if (!value?._ref) return true;

  const publishedId = context.document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = getDraftsClient(context);

  const conflictingCount = await client.fetch<number>(
    `count(*[_type == $type && topic._ref == $topicId && !(_id in [$publishedId, "drafts." + $publishedId])])`,
    { type: PAGE_TOPIC_TYPE, topicId: value._ref, publishedId },
  );

  return conflictingCount > 0
    ? 'Another Topic Page already references this topic — each topic can only back one Topic Page.'
    : true;
};

const MULTIPLE_POST_LIST_ERROR =
  'Only one Post List module is allowed per page.';
const NO_POST_LIST_WARNING =
  'This page has no Post List module — the archive will be empty until one is added.';

type TModuleReference = { _type?: string; _ref?: string };

const countPostListModules = (document: SanityDocument | undefined): number =>
  (
    (document as { modules?: TModuleReference[] } | undefined)?.modules ?? []
  ).filter((module) => module._type === postListSchema.name).length;

const validateSinglePostListModule = (
  document: SanityDocument | undefined,
): string | true =>
  countPostListModules(document) > 1 ? MULTIPLE_POST_LIST_ERROR : true;

const validateHasPostListModule = (
  document: SanityDocument | undefined,
): string | true =>
  countPostListModules(document) === 0 ? NO_POST_LIST_WARNING : true;

export const topicPageSchema = defineType({
  name: PAGE_TOPIC_TYPE,
  title: 'Topic Page',
  type: 'document',
  description:
    'The archive page for one topic, listing the posts classified under it.',
  icon: Tags,
  validation: (rule) => [
    rule.custom(validateSinglePostListModule),
    rule.custom(validateHasPostListModule).warning(),
  ],
  fields: [
    titleField({ generatesSlug: true }),
    // Sanity's default slug `isUnique` check — scoped to this document type
    // — is exactly the scope this field needs: /topics/{slug} collisions
    // only matter within page_topic itself, never against page_landing's
    // /{slug}. No custom `isUnique` override is needed on top of it.
    slugField({
      description: 'URL path segment — auto-generated from title.',
      previewInput: topicSlugUrlPreviewInput,
    }),
    defineField({
      name: 'topic',
      title: 'Topic',
      type: 'reference',
      description: 'The topic this page represents.',
      to: [{ type: topicSchema.name }],
      validation: (rule) =>
        rule.required().custom(validateUniqueTopicReference),
    }),
    headingBlockField({
      requireHeading: true,
      description: PAGE_HEADING_DESCRIPTION,
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
      topicTitle: 'topic.title',
    },
    prepare({ title, topicTitle }) {
      return {
        title: title ?? 'Unknown',
        subtitle: topicTitle ? `Topic: ${String(topicTitle)}` : undefined,
      };
    },
  },
});
