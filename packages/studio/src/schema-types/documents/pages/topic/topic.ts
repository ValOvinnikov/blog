import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { contentSchema } from '@blog/studio/schema-types/modules/content/content';
import { faqSchema } from '@blog/studio/schema-types/modules/faq/faq';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateUniqueTaxonomyReference } from '@blog/studio/schema-types/validation/validate-unique-taxonomy-reference/validate-unique-taxonomy-reference';
import { Tags } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const topicSlugUrlPreviewInput = createSlugUrlPreviewInput('/topics/');

const TOPIC_UNIQUENESS_ERROR =
  'Another Topic Page already references this topic — each topic can only back one Topic Page.';

export const topicPageSchema = defineType({
  name: PAGE_TOPIC_TYPE,
  title: 'Topic Page',
  type: 'document',
  description:
    'The archive page for one topic, listing the posts classified under it.',
  icon: Tags,
  fields: [
    titleField(),
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
    headingBlockField(),
    heroField({ allow: [heroBlogSchema.name] }),
    modulesField({
      extend: [
        postListSchema.name,
        postLatestSchema.name,
        taxonomyListSchema.name,
        contentSchema.name,
        faqSchema.name,
      ],
      once: [postListSchema.name],
    }),
    seoField(),
  ],
  preview: {
    select: {
      title: 'title',
      topicTitle: 'topic.title',
    },
    prepare({ title, topicTitle }) {
      const topicName = defaultLanguageValue(topicTitle);

      return {
        title: title ?? 'Unknown',
        subtitle: topicName ? `Topic: ${topicName}` : undefined,
      };
    },
  },
});
