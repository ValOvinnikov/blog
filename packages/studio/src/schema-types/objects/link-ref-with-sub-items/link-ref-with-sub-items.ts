import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { toToolbarIcon } from '@blog/studio/schema-types/portable-text/toolbar-icon/toolbar-icon';
import { ListTree } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

export const linkRefWithSubItemsSchema = defineType({
  name: 'linkRefWithSubItems',
  title: 'Link with sub-items',
  type: 'object',
  description: 'A link that opens a list of further links.',
  icon: toToolbarIcon(ListTree),
  fields: [
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description: 'The link document this points at.',
      to: [{ type: linkSchema.name }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subItems',
      title: 'Sub-items',
      type: 'array',
      description: 'The links listed under this one, in this order.',
      of: [defineArrayMember({ type: linkRefSchema.name })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'link.title',
      label: 'link.label.0.value',
      subItems: 'subItems',
    },
    prepare({ title, label, subItems }) {
      const count = Array.isArray(subItems) ? subItems.length : 0;

      return {
        title: String(title ?? label ?? 'No link selected'),
        subtitle: `${String(count)} sub-item${count === 1 ? '' : 's'}`,
      };
    },
  },
});
