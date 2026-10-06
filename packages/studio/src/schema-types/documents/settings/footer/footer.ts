import { languageSwitcherField } from '@blog/studio/schema-types/fields/language-switcher-field/language-switcher-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { socialProfileSchema } from '@blog/studio/schema-types/objects/social-profile/social-profile';
import { PanelBottom } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const footerSettingsSchema = defineType({
  name: 'settings_footer',
  title: 'Footer',
  type: 'document',
  description: 'What appears in the site footer, at the bottom of every page.',
  icon: PanelBottom,
  preview: { select: { title: 'title' } },
  fields: [
    titleField(),
    defineField({
      name: 'social',
      title: 'Social Links',
      type: 'array',
      description: 'Social profile links shown in the site footer.',
      of: [defineArrayMember({ type: socialProfileSchema.name })],
    }),
    languageSwitcherField(),
    defineField({
      name: 'showRssFeed',
      title: 'Show RSS feed',
      type: 'boolean',
      description: "Shows a link to your site's RSS feed.",
      initialValue: true,
    }),
  ],
});
