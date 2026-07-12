import { titleField } from '@cms/schema-types/helpers/title-field';
import { linkSchema } from '@cms/schema-types/objects/link';
import { Menu } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const navigationSchema = defineType({
  name: 'settings_navigation',
  title: 'Navigation',
  type: 'document',
  icon: Menu,
  preview: { select: { title: 'title' } },
  fields: [
    titleField(),
    defineField({
      name: 'items',
      title: 'Header Links',
      type: 'array',
      description: 'Top-level nav links rendered in the site header.',
      of: [defineArrayMember({ type: linkSchema.name })],
    }),
  ],
});
