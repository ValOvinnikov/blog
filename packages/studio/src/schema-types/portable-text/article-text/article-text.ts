import { asideSchema } from '@blog/studio/schema-types/objects/aside/aside';
import { bodyImageSchema } from '@blog/studio/schema-types/objects/body-image/body-image';
import { linkRefSchema } from '@blog/studio/schema-types/objects/link-ref/link-ref';
import { defineArrayMember, defineType } from 'sanity';

export const articleTextSchema = defineType({
  name: 'articleText',
  title: 'Article Text',
  type: 'array',
  description:
    'The main body of a post or content module, supporting headings, images, code blocks, and asides.',
  of: [
    defineArrayMember({
      type: 'block',
      // Excludes H1 so the body never competes with the post/page title's own heading.
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        annotations: [{ type: linkRefSchema.name }],
      },
    }),
    defineArrayMember({ type: bodyImageSchema.name }),
    defineArrayMember({ type: 'code' }),
    defineArrayMember({ type: asideSchema.name }),
  ],
});
