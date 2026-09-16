import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABEL,
  type TSocialPlatform,
} from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { Share2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

/** A social platform paired with the reusable link to that profile. */
export const socialProfileSchema = defineType({
  name: 'socialProfile',
  title: 'Social Profile',
  type: 'object',
  description:
    'One social platform icon, linked to that profile via a reusable link.',
  icon: Share2,
  fields: [
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description: 'The link document this social profile points at.',
      to: [{ type: linkSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      description:
        'Which social network this is, so the right icon shows next to it.',
      options: {
        layout: 'radio',
        list: Object.values(SOCIAL_PLATFORMS).map((value) => ({
          title: SOCIAL_PLATFORM_LABEL[value],
          value,
        })),
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'link.label',
      platform: 'platform',
    },
    prepare({ title, platform }) {
      const platformLabel = SOCIAL_PLATFORM_LABEL[platform as TSocialPlatform];

      return {
        title: String(title ?? platformLabel ?? 'No link selected'),
        subtitle: platformLabel,
      };
    },
  },
});
