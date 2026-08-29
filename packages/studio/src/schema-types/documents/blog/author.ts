import { blockTextSchema } from '@blog/studio/schema-types/objects/block-text';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt';
import { socialLinkSchema } from '@blog/studio/schema-types/objects/social-link';
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
    defineField({
      name: 'profilePage',
      title: 'Profile Page',
      type: 'reference',
      description: "Optional page this author's byline links to.",
      // Literal (not `genericSchema.name`): importing page.ts here closes a
      // circular import (page → module-cta → link → post → author) —
      // typegen fails otherwise.
      to: [{ type: 'page_generic' }],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
});
