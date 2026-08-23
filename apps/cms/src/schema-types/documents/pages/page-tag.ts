import { createSlugUrlPreviewInput } from '@cms/schema-types/components/slug-url-preview-input';
import { tagSchema } from '@cms/schema-types/documents/blog/tag';
import { PAGE_TAG_TYPE } from '@cms/schema-types/documents/pages/page-tag-type';
import { defineModulesField } from '@cms/schema-types/helpers/define-modules-field';
import { titleField } from '@cms/schema-types/helpers/title-field';
import { ctaSchema } from '@cms/schema-types/modules/module-cta';
import { newsletterSchema } from '@cms/schema-types/modules/module-newsletter';
import { postLatestSchema } from '@cms/schema-types/modules/module-post-latest';
import { postListSchema } from '@cms/schema-types/modules/module-post-list';
import { seoSchema } from '@cms/schema-types/objects/seo';
import { Tag } from 'lucide-react';
import { defineField, defineType, type ValidationContext } from 'sanity';

const TAG_UNIQUENESS_API_VERSION = '2024-01-01';
const tagSlugUrlPreviewInput = createSlugUrlPreviewInput('/tags/');

type TTagReferenceValue = { _ref?: string } | undefined;

/**
 * Rejects a second `page_tag` referencing an already-covered `blog_tag` —
 * `/tags/{slug}` would otherwise be ambiguous. `perspective: 'drafts'` so an
 * unpublished conflicting page still counts.
 */
const validateUniqueTagReference = async (
  value: TTagReferenceValue,
  context: ValidationContext,
): Promise<string | true> => {
  if (!value?._ref) return true;

  const publishedId = context.document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = context
    .getClient({ apiVersion: TAG_UNIQUENESS_API_VERSION })
    .withConfig({ perspective: 'drafts' });

  const conflictingCount = await client.fetch<number>(
    `count(*[_type == $type && tag._ref == $tagId && !(_id in [$publishedId, "drafts." + $publishedId])])`,
    { type: PAGE_TAG_TYPE, tagId: value._ref, publishedId },
  );

  return conflictingCount > 0
    ? 'Another Tag Page already references this tag — each tag can only back one Tag Page.'
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
