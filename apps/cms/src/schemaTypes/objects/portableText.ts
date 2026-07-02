import { defineArrayMember, defineType } from 'sanity';

export default defineType({
  name: 'portableText',
  title: 'Portable Text',
  type: 'array',
  of: [
    defineArrayMember({ type: 'block' }),
    defineArrayMember({ type: 'imageWithAlt' }),
    defineArrayMember({ type: 'code' }),
  ],
});
