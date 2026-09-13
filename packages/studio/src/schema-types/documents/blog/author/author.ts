import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { socialLinkSchema } from '@blog/studio/schema-types/objects/social-link/social-link';
import { proseTextSchema } from '@blog/studio/schema-types/portable-text/prose-text/prose-text';
import { UserRound } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const authorSchema = defineType({
  name: 'blog_author',
  title: 'Author',
  type: 'document',
  description:
    'A contributor profile — name, photo, and bio — credited on the posts they wrote and shown on the author page.',
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
      description:
        'Avatar shown on posts and the author profile page. Leave empty to show initials instead.',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: proseTextSchema.name,
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
      to: [{ type: PAGE_LANDING_TYPE }],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
});
