import { Menu } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { titleField } from '../../helpers/title-field';

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
      of: [defineArrayMember({ type: 'link' })],
    }),
  ],
});
