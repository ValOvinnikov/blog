import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { linkSchema } from '@blog/studio/schema-types/objects/link/link';
import { PanelBottom } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const footerSettingsSchema = defineType({
  name: 'settings_footer',
  title: 'Footer',
  type: 'document',
  description: 'The social links shown in the site footer.',
  icon: PanelBottom,
  preview: { select: { title: 'title' } },
  fields: [
    titleField(),
    defineField({
      name: 'social',
      title: 'Social Links',
      type: 'array',
      description: 'Social profile links shown in the site footer.',
      of: [defineArrayMember({ type: linkSchema.name })],
    }),
  ],
});
