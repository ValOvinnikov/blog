import { createSlugUrlPreviewInput } from '@cms/schema-types/components/slug-url-preview-input';
import { topicSchema } from '@cms/schema-types/documents/blog/topic';
import { PAGE_TOPIC_TYPE } from '@cms/schema-types/documents/pages/page-topic-type';
import { defineModulesField } from '@cms/schema-types/helpers/define-modules-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { ctaSchema } from '@cms/schema-types/modules/module-cta';
import { newsletterSchema } from '@cms/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@cms/schema-types/modules/module-post-latest';
import { postListSchema } from '@cms/schema-types/modules/module-post-list';
import { seoSchema } from '@cms/schema-types/objects/seo';
import { Tags } from 'lucide-react';
import { defineField, defineType, type ValidationContext } from 'sanity';

const TOPIC_UNIQUENESS_API_VERSION = '2024-01-01';
const topicSlugUrlPreviewInput = createSlugUrlPreviewInput('/topics/');

type TTopicReferenceValue = { _ref?: string } | undefined;

/**
 * Rejects a second `page_topic` referencing an already-covered `blog_topic`
 * — `/topics/{slug}` would otherwise be ambiguous. `perspective: 'drafts'`
 * so an unpublished conflicting page still counts.
 */
const validateUniqueTopicReference = async (
  value: TTopicReferenceValue,
  context: ValidationContext,
): Promise<string | true> => {
  if (!value?._ref) return true;

  const publishedId = context.document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = context
    .getClient({ apiVersion: TOPIC_UNIQUENESS_API_VERSION })
    .withConfig({ perspective: 'drafts' });

  const conflictingCount = await client.fetch<number>(
    `count(*[_type == $type && topic._ref == $topicId && !(_id in [$publishedId, "drafts." + $publishedId])])`,
    { type: PAGE_TOPIC_TYPE, topicId: value._ref, publishedId },
  );

  return conflictingCount > 0
    ? 'Another Topic Page already references this topic — each topic can only back one Topic Page.'
    : true;
};

export const pageTopicSchema = defineType({
  name: PAGE_TOPIC_TYPE,
  title: 'Topic Page',
  type: 'document',
  icon: Tags,
  fields: [
    titleField(),
    // Sanity's default slug `isUnique` check — scoped to this document type
    // — is exactly the scope this field needs: /topics/{slug} collisions
    // only matter within page_topic itself, never against page_generic's
    // /{slug}. No custom `isUnique` override is needed on top of it.
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path segment — auto-generated from title.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      components: { input: topicSlugUrlPreviewInput },
      validation: (rule) => rule.required(),
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
    defineField({
      name: 'postList',
      title: 'Post List',
      type: 'reference',
      description:
        'The paginated post archive, scoped to this topic, rendered on this page.',
      to: [{ type: postListSchema.name }],
    }),
    defineModulesField({
      allow: [postLatestSchema.name, ctaSchema.name, newsletterSchema.name],
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override Topic page meta title, description, and social sharing image.',
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
