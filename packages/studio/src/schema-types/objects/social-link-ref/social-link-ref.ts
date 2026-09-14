import { SOCIAL_PLATFORMS } from '@blog/config/constants';
import { linkRefFields } from '@blog/studio/schema-types/fields/link-ref-fields/link-ref-fields';
import { toTitleCase } from '@blog/utils/primitives';
import { defineField, defineType } from 'sanity';

export const socialLinkRefSchema = defineType({
  name: 'socialLinkRef',
  title: 'Social Link',
  type: 'object',
  description:
    'A social profile link authored by naming its platform and choosing a shared link.',
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      description:
        'Which social platform this link represents, used for icon selection.',
      options: {
        layout: 'radio',
        list: Object.values(SOCIAL_PLATFORMS).map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    ...linkRefFields(),
  ],
  preview: {
    select: {
      platform: 'platform',
      labelOverride: 'labelOverride',
      linkLabel: 'link.label',
    },
    prepare({ platform, labelOverride, linkLabel }) {
      return {
        title: String(labelOverride ?? linkLabel ?? 'Unknown'),
        subtitle: platform ? toTitleCase(String(platform)) : undefined,
      };
    },
  },
});
