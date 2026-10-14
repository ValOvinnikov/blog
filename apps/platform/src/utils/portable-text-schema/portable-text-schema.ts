import { defineSchema } from '@portabletext/editor';

/** Must match `@blog/email`'s `serializePortableText`, which silently drops any block type, style or mark it does not recognise. */
export const EMAIL_PORTABLE_TEXT_SCHEMA = defineSchema({
  decorators: [{ name: 'strong' }, { name: 'em' }],
  styles: [{ name: 'normal' }, { name: 'h2' }],
  lists: [{ name: 'bullet' }, { name: 'number' }],
  annotations: [{ name: 'link', fields: [{ name: 'href', type: 'string' }] }],
});

/** Whether a Portable Text value carries no real authored content — an unset/empty value, or a single empty default-style paragraph. */
export const isBlankPortableTextValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return true;
  if (!Array.isArray(value) || value.length === 0) return true;
  if (value.length > 1) return false;

  const [block] = value as Array<Record<string, unknown>>;
  if (!block || block._type !== 'block') return false;
  if (block.style && block.style !== 'normal') return false;
  if (block.listItem) return false;

  const children = Array.isArray(block.children) ? block.children : [];
  if (children.length === 0) return true;
  if (children.length > 1) return false;

  const [span] = children as Array<Record<string, unknown>>;
  const text = typeof span?.text === 'string' ? span.text : '';
  const marks = Array.isArray(span?.marks) ? span.marks : [];
  return text.trim() === '' && marks.length === 0;
};
