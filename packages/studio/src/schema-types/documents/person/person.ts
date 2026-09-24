import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';
import { paragraphTextSchema } from '@blog/studio/schema-types/portable-text/paragraph-text/paragraph-text';
import { UserRound } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const personSchema = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  description:
    'A person the site credits or introduces — shown on the posts they wrote, on a profile hero, and on the team.',
  icon: UserRound,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description:
        'Full display name shown on posts and any hero introducing this person.',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: imageWithAltSchema.name,
      description:
        "Photo shown on posts and this person's profile hero. Leave empty to show initials instead.",
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: paragraphTextSchema.name,
      description: "Short biography shown on this person's profile hero.",
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description:
        'Job title or role shown beneath their name (e.g. "Senior Engineer").',
      validation: (rule) => rule.max(100),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      description:
        "Links to social profiles shown on this person's profile hero.",
      of: [defineArrayMember({ type: socialProfileSchema.name })],
    }),
    defineField({
      name: 'profilePage',
      title: 'Profile Page',
      type: 'reference',
      description: "Optional page this person's byline links to.",
      to: [{ type: linkSchema.name }],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'image',
    },
  },
});
