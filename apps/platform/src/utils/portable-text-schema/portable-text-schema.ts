import { defineSchema } from '@portabletext/editor';

/** Must match `@blog/email`'s `serializePortableText`, which silently drops any block type, style or mark it does not recognise. */
export const EMAIL_PORTABLE_TEXT_SCHEMA = defineSchema({
  decorators: [{ name: 'strong' }, { name: 'em' }],
  styles: [{ name: 'normal' }, { name: 'h2' }],
  lists: [{ name: 'bullet' }, { name: 'number' }],
  annotations: [{ name: 'link', fields: [{ name: 'href', type: 'string' }] }],
});
