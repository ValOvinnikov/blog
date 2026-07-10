import { Menu } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'settings_navigation',
  title: 'Navigation',
  type: 'document',
  icon: Menu,
  fields: [
    defineField({
      name: 'items',
      title: 'Header Links',
      type: 'array',
      description: 'Top-level nav links rendered in the site header.',
      of: [defineArrayMember({ type: 'navItem' })],
    }),
  ],
});
