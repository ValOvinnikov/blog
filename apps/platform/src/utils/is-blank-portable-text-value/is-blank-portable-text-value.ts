import {
  hasArrayGotMultipleItems,
  hasLength,
  isNull,
  isString,
  isUndefined,
} from '@blog/utils/primitives';

type TLooseNode = Record<string, unknown>;

export const isBlankPortableTextValue = (value: unknown): boolean => {
  if (isUndefined(value) || isNull(value) || !Array.isArray(value)) return true;
  const blocks = value as TLooseNode[];
  if (!hasLength(blocks)) return true;
  if (hasArrayGotMultipleItems(blocks)) return false;

  const [block] = blocks;
  if (!block || block._type !== 'block') return false;
  if (block.style && block.style !== 'normal') return false;
  if (block.listItem) return false;

  const children = (
    Array.isArray(block.children) ? block.children : []
  ) as TLooseNode[];
  if (!hasLength(children)) return true;
  if (hasArrayGotMultipleItems(children)) return false;

  const [span] = children;
  const text = isString(span?.text) ? span.text : '';
  const marks = Array.isArray(span?.marks) ? span.marks : [];
  return text.trim() === '' && !hasLength(marks);
};
