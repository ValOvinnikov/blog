import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/components/slug-url-preview-input';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { defineModulesField } from '@blog/studio/schema-types/helpers/define-modules-field';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import { headingBlockField } from '@blog/studio/schema-types/helpers/heading-block-field';
import { heroField } from '@blog/studio/schema-types/helpers/hero-field';
import { seoField } from '@blog/studio/schema-types/helpers/seo-field';
import { slugField } from '@blog/studio/schema-types/helpers/slug-field';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { ctaSchema } from '@blog/studio/schema-types/modules/module-cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/module-post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/module-post-list';
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

const HERO_OR_HEADING_ERROR = 'Add a hero or a heading';
const HERO_HIDES_HEADING_WARNING = 'The hero hides the heading';

type TTopicPageDocument = {
  hero?: { _ref?: string };
  headingBlock?: { heading?: string };
  topic?: { _ref?: string };
};

const asTopicPageDocument = (
  document: SanityDocument | undefined,
): TTopicPageDocument | undefined => document as TTopicPageDocument | undefined;

const hasHero = (document: SanityDocument | undefined): boolean =>
  Boolean(asTopicPageDocument(document)?.hero?._ref);

const hasHeading = (document: SanityDocument | undefined): boolean =>
  Boolean(asTopicPageDocument(document)?.headingBlock?.heading);

/**
 * The referenced topic's own title satisfies the hero-or-heading
 * requirement — a Topic Page can render its h1 from the topic alone, so
 * only a page with neither a hero, a heading, nor a resolvable topic title
 * errors.
 */
const validateTopicHeroOrHeading = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  if (hasHero(document) || hasHeading(document)) return true;

  const topicRef = asTopicPageDocument(document)?.topic?._ref;

  if (!topicRef) return HERO_OR_HEADING_ERROR;

  const client = getDraftsClient(context);

  const topicTitle = await client.fetch<string | null>(
    `*[_id == $id][0].title`,
    { id: topicRef },
  );

  return topicTitle ? true : HERO_OR_HEADING_ERROR;
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

export const pageTopicSchema = defineType({
  name: PAGE_TOPIC_TYPE,
  title: 'Topic Page',
  type: 'document',
  icon: Tags,
  validation: (rule) => [
    rule.custom(validateTopicHeroOrHeading),
    rule.custom(validateHeroHidesHeading).warning(),
    rule.custom(validateSinglePostListModule),
    rule.custom(validateHasPostListModule).warning(),
  ],
  fields: [
    titleField(),
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
    seoField({
      description:
        'Topic page meta title, description, and social sharing image.',
    }),
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
