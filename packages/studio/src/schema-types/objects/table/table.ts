import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import {
  boldDecorator,
  italicDecorator,
} from '@blog/studio/schema-types/portable-text/decorators/decorators';
import { normalBlockStyle } from '@blog/studio/schema-types/portable-text/listed-text/listed-text';
import { validateTableColumnCount } from '@blog/studio/schema-types/validation/validate-table-column-count/validate-table-column-count';
import { Table } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';

// Sanity's table plugin binds to these exact type and field names: table > rows > row > cells > cell > value.
const cellSchema = defineArrayMember({
  name: 'cell',
  title: 'Cell',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      title: 'Content',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [normalBlockStyle],
          lists: [],
          marks: {
            decorators: [boldDecorator, italicDecorator],
            annotations: [{ type: linkRefSchema.name }],
          },
        }),
      ],
    }),
  ],
});

const rowSchema = defineArrayMember({
  name: 'row',
  title: 'Row',
  type: 'object',
  fields: [
    defineField({
      name: 'cells',
      title: 'Cells',
      type: 'array',
      of: [cellSchema],
    }),
  ],
});

export const tableSchema = defineType({
  name: PORTABLE_TEXT_BLOCK_TYPE.TABLE,
  title: 'Table',
  type: 'object',
  description:
    'Rows and columns of short text, such as a list of tools and what each one does.',
  icon: Table,
  validation: (rule) => rule.custom(validateTableColumnCount).warning(),
  fields: [
    defineField({
      name: 'headerRows',
      title: 'Header Rows',
      type: 'number',
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [rowSchema],
    }),
  ],
});
