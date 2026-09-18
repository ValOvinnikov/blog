import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { heroField } from '@blog/studio/schema-types/fields/hero-field/hero-field';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { heroBlogSchema } from '@blog/studio/schema-types/modules/hero-blog/hero-blog';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postLatestSchema } from '@blog/studio/schema-types/modules/post-latest/post-latest';
import { postListSchema } from '@blog/studio/schema-types/modules/post-list/post-list';
import { taxonomyListSchema } from '@blog/studio/schema-types/modules/taxonomy-list/taxonomy-list';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import {
  validateHasPostListModule,
  validateSinglePostListModule,
} from '@blog/studio/schema-types/validation/validate-post-list-cardinality/validate-post-list-cardinality';
import { validateUniquePostListReference } from '@blog/studio/schema-types/validation/validate-unique-post-list-reference/validate-unique-post-list-reference';
import { validateUniqueTaxonomyReference } from '@blog/studio/schema-types/validation/validate-unique-taxonomy-reference/validate-unique-taxonomy-reference';
import { Tag } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const tagSlugUrlPreviewInput = createSlugUrlPreviewInput('/tags/');

const NO_POST_LIST_WARNING =
  'This page has no Post List module — the archive will be empty until one is added.';
const TAG_UNIQUENESS_ERROR =
  'Another Tag Page already references this tag — each tag can only back one Tag Page.';
const POST_LIST_UNIQUENESS_ERROR =
  'Another Tag Page already references this Post List — each Post List can only back one Tag Page.';

export const tagPageSchema = defineType({
  name: PAGE_TAG_TYPE,
  title: 'Tag Page',
  type: 'document',
  description:
    'The archive page for one tag, listing the posts labeled with it.',
  icon: Tag,
  validation: (rule) => [
    rule.custom(validateSinglePostListModule),
    rule.custom(validateHasPostListModule(NO_POST_LIST_WARNING)).warning(),
    rule.custom(
      validateUniquePostListReference(
        PAGE_TAG_TYPE,
        POST_LIST_UNIQUENESS_ERROR,
      ),
    ),
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
      validation: (rule) =>
        rule
          .required()
          .custom(
            validateUniqueTaxonomyReference(
              PAGE_TAG_TYPE,
              'tag',
              TAG_UNIQUENESS_ERROR,
            ),
          ),
    }),
    headingBlockField(),
    heroField({ allow: [heroBlogSchema.name] }),
    modulesField({
      allow: [
        postListSchema.name,
        postLatestSchema.name,
        ctaSchema.name,
        newsletterSchema.name,
        taxonomyListSchema.name,
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
