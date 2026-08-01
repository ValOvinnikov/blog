import { defineArrayMember, defineType } from 'sanity';

import { asideSchema } from './aside';
import { bodyImageSchema } from './body-image';

export const richTextSchema = defineType({
  name: 'richText',
  title: 'Rich Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      // Excludes H1: the post/page title already renders its own H1 outside
      // this field, so an editor picking H1 here would produce a second,
      // competing top-level heading. H2–H4 keep body headings subordinate
      // to that title.
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
    }),
    defineArrayMember({ type: bodyImageSchema.name }),
    defineArrayMember({ type: 'code' }),
    defineArrayMember({ type: asideSchema.name }),
  ],
});
