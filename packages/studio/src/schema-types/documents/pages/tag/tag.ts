import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { PAGE_TAG_TYPE } from '@blog/studio/schema-types/documents/pages/tag/tag-type';
import { tagTemplateSchema } from '@blog/studio/schema-types/documents/templates/tag/tag';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { templateField } from '@blog/studio/schema-types/fields/template-field/template-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { validateUniqueTaxonomyReference } from '@blog/studio/schema-types/validation/validate-unique-taxonomy-reference/validate-unique-taxonomy-reference';
import { Tag } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const tagSlugUrlPreviewInput = createSlugUrlPreviewInput('/tags/');

const TAG_UNIQUENESS_ERROR =
  'Another Tag Page already references this tag — each tag can only back one Tag Page.';

export const tagPageSchema = defineType({
  name: PAGE_TAG_TYPE,
  title: 'Tag Page',
  type: 'document',
  description:
    'The archive page for one tag, listing the posts labeled with it.',
  icon: Tag,
  fields: [
    titleField(),
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
    templateField({ type: tagTemplateSchema.name }),
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
