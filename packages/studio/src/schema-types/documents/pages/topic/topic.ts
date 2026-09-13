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
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import {
  validateHasPostListModule,
  validateSinglePostListModule,
} from '@blog/studio/schema-types/validation/validate-post-list-cardinality/validate-post-list-cardinality';
import { validateUniquePostListReference } from '@blog/studio/schema-types/validation/validate-unique-post-list-reference/validate-unique-post-list-reference';
import { validateUniqueTaxonomyReference } from '@blog/studio/schema-types/validation/validate-unique-taxonomy-reference/validate-unique-taxonomy-reference';
import { Tags } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const topicSlugUrlPreviewInput = createSlugUrlPreviewInput('/topics/');

const NO_POST_LIST_WARNING =
  'This page has no Post List module — the archive will be empty until one is added.';
const TOPIC_UNIQUENESS_ERROR =
  'Another Topic Page already references this topic — each topic can only back one Topic Page.';
const POST_LIST_UNIQUENESS_ERROR =
  'Another Topic Page already references this Post List — each Post List can only back one Topic Page.';

export const topicPageSchema = defineType({
  name: PAGE_TOPIC_TYPE,
  title: 'Topic Page',
  type: 'document',
  description:
    'The archive page for one topic, listing the posts classified under it.',
  icon: Tags,
  validation: (rule) => [
    rule.custom(validateSinglePostListModule),
    rule.custom(validateHasPostListModule(NO_POST_LIST_WARNING)).warning(),
    rule.custom(
      validateUniquePostListReference(
        PAGE_TOPIC_TYPE,
        POST_LIST_UNIQUENESS_ERROR,
      ),
    ),
  ],
  fields: [
    titleField(),
    // Sanity's default slug `isUnique` check — scoped to this document type
    // — is exactly the scope this field needs: /topics/{slug} collisions
    // only matter within page_topic itself, never against page_landing's
    // /{slug}. No custom `isUnique` is needed on top of it.
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
        rule
          .required()
          .custom(
            validateUniqueTaxonomyReference(
              PAGE_TOPIC_TYPE,
              'topic',
              TOPIC_UNIQUENESS_ERROR,
            ),
          ),
    }),
    headingBlockField({
      requireHeading: true,
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
