import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { PAGE_TOPIC_TYPE } from '@blog/studio/schema-types/documents/pages/topic/topic-type';
import { topicTemplateSchema } from '@blog/studio/schema-types/documents/templates/topic/topic';
import { languageField } from '@blog/studio/schema-types/fields/language-field/language-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { templateField } from '@blog/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { pageHeadingBlockField } from '@blog/studio/schema-types/objects/page-heading-block/page-heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { defaultLanguageValue } from '@blog/studio/schema-types/validation/default-language-value/default-language-value';
import { validateSlugUniqueInLanguage } from '@blog/studio/schema-types/validation/validate-slug-unique-in-language/validate-slug-unique-in-language';
import { validateUniqueTaxonomyReference } from '@blog/studio/schema-types/validation/validate-unique-taxonomy-reference/validate-unique-taxonomy-reference';
import { Tags } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const topicSlugUrlPreviewInput = createSlugUrlPreviewInput('/topics/');

const TOPIC_UNIQUENESS_ERROR =
  'Another Topic Page in this language already references this topic — each topic can only back one Topic Page per language.';

export const topicPageSchema = defineType({
  name: PAGE_TOPIC_TYPE,
  title: 'Topic Page',
  type: 'document',
  description:
    'The archive page for one topic, listing the posts classified under it.',
  icon: Tags,
  fields: [
    languageField(),
    titleField(),
    slugField({
      description: 'URL path segment — auto-generated from title.',
      previewInput: topicSlugUrlPreviewInput,
      isUnique: validateSlugUniqueInLanguage,
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
    pageHeadingBlockField(),
    templateField({ type: topicTemplateSchema.name }),
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
