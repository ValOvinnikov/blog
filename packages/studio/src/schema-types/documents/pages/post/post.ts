import { authorSchema } from '@blog/studio/schema-types/documents/blog/author/author';
import { tagSchema } from '@blog/studio/schema-types/documents/blog/tag/tag';
import { topicSchema } from '@blog/studio/schema-types/documents/blog/topic/topic';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { modulesField } from '@blog/studio/schema-types/fields/modules-field/modules-field';
import { slugField } from '@blog/studio/schema-types/fields/slug-field/slug-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { createSlugUrlPreviewInput } from '@blog/studio/schema-types/inputs/slug-url-preview/slug-url-preview-input';
import { ctaSchema } from '@blog/studio/schema-types/modules/cta/cta';
import { newsletterSchema } from '@blog/studio/schema-types/modules/newsletter/newsletter';
import { postRelatedSchema } from '@blog/studio/schema-types/modules/post-related/post-related';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { seoField } from '@blog/studio/schema-types/objects/seo/seo-field';
import { skimSchema } from '@blog/studio/schema-types/objects/skim/skim';
import { richTextSchema } from '@blog/studio/schema-types/portable-text/rich-text/rich-text';
import { validateSingleBlankHeadingPerType } from '@blog/studio/schema-types/validation/validate-single-blank-heading-per-type/validate-single-blank-heading-per-type';
import { Newspaper } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

const postSlugUrlPreviewInput = createSlugUrlPreviewInput('/blog/');

export const postPageSchema = defineType({
  name: PAGE_POST_TYPE,
  title: 'Post Page',
  type: 'document',
  icon: Newspaper,
  fields: [
    titleField({ generatesSlug: true }),
    // Sanity's default slug `isUnique` check — scoped to this document type
    // — is exactly the scope this field needs: /blog/{slug} collisions only
    // matter within page_post itself, never against page_landing's /{slug}.
    // No custom `isUnique` override is needed on top of it.
    slugField({
      description: 'URL path segment — auto-generated from title.',
      previewInput: postSlugUrlPreviewInput,
    }),
    headingBlockField({
      requireHeading: true,
      description: "The post title, shown as the page's H1.",
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: imageWithAltSchema.name,
      description:
        'Optional hero image shown at the top of the post and in social shares.',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: richTextSchema.name,
      description:
        'Full post content — supports rich text, images, and code blocks.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description:
        'Marks this post for the Newest featured source of the blog hero and the featured spotlight.',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      description: 'The person who wrote this post.',
      to: [{ type: authorSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'topic',
      title: 'Topic',
      type: 'reference',
      description: "The post's primary topic classification.",
      to: [{ type: topicSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      description:
        'Topics for discovery — power /tag pages, related posts, and the article footer chips.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{ type: tagSchema.name }],
        }),
      ],
      validation: (rule) => rule.max(6),
    }),
    modulesField({
      allow: [postRelatedSchema.name, newsletterSchema.name, ctaSchema.name],
      validateCustom: (rule) =>
        rule.custom(
          validateSingleBlankHeadingPerType([postRelatedSchema.name]),
        ),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      description: 'Controls sort order and the date shown to readers.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'skim',
      title: 'Skim',
      type: skimSchema.name,
      description:
        '30-second-skim takeaways for the choose-your-depth reading experience.',
    }),
    seoField(),
  ],
  preview: {
    select: {
      heading: 'headingBlock.heading',
      title: 'title',
      author: 'author.name',
      media: 'heroImage',
    },
    prepare({ heading, title, author, media }) {
      return {
        title: heading ?? title ?? 'Unknown',
        subtitle: author ? `by ${String(author)}` : '',
        media,
      };
    },
  },
});
