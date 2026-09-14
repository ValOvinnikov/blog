import { linksField } from '@blog/studio/schema-types/fields/links-field/links-field';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { Menu } from 'lucide-react';
import { defineType } from 'sanity';

export const navigationSettingsSchema = defineType({
  name: 'settings_navigation',
  title: 'Navigation',
  type: 'document',
  description: 'The links shown in the main site navigation.',
  icon: Menu,
  preview: { select: { title: 'title' } },
  fields: [
    titleField(),
    linksField({
      name: 'items',
      title: 'Header Links',
      description: 'Top-level nav links rendered in the site header.',
      of: [linkRefSchema.name],
    }),
  ],
});
