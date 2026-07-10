import { PanelBottom } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export default defineType({
  name: 'settings_footer',
  title: 'Footer',
  type: 'document',
  icon: PanelBottom,
  fields: [
    defineField({
      name: 'social',
      title: 'Social Links',
      type: 'array',
      description: 'Social profile links shown in the site footer.',
      of: [defineArrayMember({ type: 'socialLink' })],
    }),
  ],
});
