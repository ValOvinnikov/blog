import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/page-post-type';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt';
import { richTextSchema } from '@blog/studio/schema-types/objects/rich-text';
import { seoSchema } from '@blog/studio/schema-types/objects/seo';
import { skimSchema } from '@blog/studio/schema-types/objects/skim';
import { Newspaper } from 'lucide-react';
import {
  defineArrayMember,
  defineField,
  defineType,
  type SanityDocument,
  type ValidationContext,
} from 'sanity';

import { authorSchema } from './author';
import { tagSchema } from './tag';
import { topicSchema } from './topic';

/**
 * Warns (does not block publishing) when no `page_post` references this
 * post — `/blog/{slug}` 404s with no runtime fallback in that state, so
 * the editor should see the gap on the document they'd fix it from.
 */
const validateHasPagePost = async (
  document: SanityDocument | undefined,
  context: ValidationContext,
): Promise<string | true> => {
  const publishedId = document?._id.replace(/^drafts\./, '');

  if (!publishedId) return true;

  const client = getDraftsClient(context);

  const referencingCount = await client.fetch<number>(
    `count(*[_type == $type && post._ref == $postId])`,
    { type: PAGE_POST_TYPE, postId: publishedId },
  );

  return referencingCount > 0
    ? true
    : 'No Post Page references this post yet — /blog/{slug} will 404 until one is created.';
};

export const postSchema = defineType({
  name: 'blog_post',
  title: 'Post',
  type: 'document',
  icon: Newspaper,
  validation: (rule) => rule.custom(validateHasPagePost).warning(),
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The headline displayed on the post page and in cards.',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path segment — auto-generated from the title.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      description:
        'Short summary shown in cards, meta description, and RSS feed.',
      validation: (rule) => rule.required().min(50).max(300),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: imageWithAltSchema.name,
      description:
        'Optional hero image shown at the top of the post and in social shares.',
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
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      description: 'Controls sort order and the date shown to readers.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: richTextSchema.name,
      description:
        'Full post content — supports rich text, images, and code blocks.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Pin this post to the featured slot on the home page.',
    }),
    defineField({
      name: 'newsletterEnabled',
      title: 'Show Newsletter Signup',
      type: 'boolean',
      description:
        'Show the newsletter signup form on this post page. Disable to opt this post out.',
      initialValue: true,
    }),
    defineField({
      name: 'skim',
      title: 'Skim',
      type: skimSchema.name,
      description:
        '30-second-skim takeaways for the choose-your-depth reading experience.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: seoSchema.name,
      description:
        'Override meta title, description, and OG image for search engines.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'heroImage',
    },
    prepare({ title, author, media }) {
      return {
        title: title ?? 'Unknown',
        subtitle: author ? `by ${String(author)}` : '',
        media,
      };
    },
  },
});
