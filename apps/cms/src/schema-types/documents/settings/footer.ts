import { PanelBottom } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

import { titleField } from '../../helpers/title-field';
import { linkSchema } from '../../objects/link';

export const footerSchema = defineType({
  name: 'settings_footer',
  title: 'Footer',
  type: 'document',
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
