import {
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABEL,
  type TSocialPlatform,
} from '@blog/config/constants';
import { linkReferenceField } from '@blog/studio/schema-types/fields/link-reference-field/link-reference-field';
import { Share2 } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export const socialProfileSchema = defineType({
  name: 'socialProfile',
  title: 'Social Profile',
  type: 'object',
  description:
    'One social platform icon, linked to that profile via a reusable link.',
  icon: Share2,
  fields: [
    linkReferenceField({
      description: 'The link document this social profile points at.',
      isRequired: true,
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
      title: 'link.label.0.value',
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
