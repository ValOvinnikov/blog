import { linkReferenceField } from '@blog/studio/schema-types/fields/link-reference-field/link-reference-field';
import {
  linkReferencePreviewSelect,
  toLinkReferencePreviewTitle,
} from '@blog/studio/schema-types/fields/link-reference-field/link-reference-preview';
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
    linkReferenceField({
      description: 'The link document this points at.',
      isRequired: true,
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
    select: { ...linkReferencePreviewSelect, subItems: 'subItems' },
    prepare({ subItems, ...value }) {
      const count = Array.isArray(subItems) ? subItems.length : 0;

      return {
        title: toLinkReferencePreviewTitle(value),
        subtitle: `${String(count)} sub-item${count === 1 ? '' : 's'}`,
      };
    },
  },
});
