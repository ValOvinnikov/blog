import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { inlineLinkSchema } from '@blog/studio/schema-types/objects/inline-link/inline-link';
import { Menu } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const navigationSettingsSchema = defineType({
  name: 'settings_navigation',
  title: 'Navigation',
  type: 'document',
  description: 'The links shown in the main site navigation.',
  icon: Menu,
  preview: { select: { title: 'title' } },
  fields: [
    titleField(),
    defineField({
      name: 'items',
      title: 'Header Links',
      type: 'array',
      description: 'Top-level nav links rendered in the site header.',
      of: [defineArrayMember({ type: inlineLinkSchema.name })],
    }),
  ],
});
