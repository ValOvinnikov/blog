import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { linkSchema } from '@blog/studio/schema-types/objects/link/link';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
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
      of: [
        defineArrayMember({ type: linkSchema.name }),
        defineArrayMember({ type: linkRefSchema.name }),
      ],
    }),
  ],
});
