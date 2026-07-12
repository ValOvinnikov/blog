import { blockTextSchema } from '@cms/schema-types/objects/block-text';
import { imageWithAltSchema } from '@cms/schema-types/objects/image-with-alt';
import { socialLinkSchema } from '@cms/schema-types/objects/social-link';
import { UserRound } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const authorSchema = defineType({
  name: 'blog_author',
  title: 'Author',
  type: 'document',
  icon: UserRound,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Full display name shown on posts and the author page.',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'URL path segment for the author page — auto-generated from name.',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: imageWithAltSchema.name,
      description: 'Avatar shown on posts and the author profile page.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: blockTextSchema.name,
      description: 'Short biography displayed on the author page.',
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description:
        'Job title or role shown beneath the author name (e.g. "Senior Engineer").',
      validation: (rule) => rule.max(100),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      description: 'Links to social profiles shown on the author page.',
      of: [defineArrayMember({ type: socialLinkSchema.name })],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
});
