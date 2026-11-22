import type { TPortableTextNode } from '@shinefold/email/portable-text';

const LINK_KEY = 'linked-link';

let keySeq = 0;
function nextKey(prefix: string): string {
  return `${prefix}-${String(keySeq++)}`;
}

export function mockPortableTextSpan(
  text: string,
  marks: string[] = [],
): TPortableTextNode {
  return { _type: 'span', _key: nextKey('span'), text, marks };
}

export function mockPortableTextBlock<TBlock = TPortableTextNode>(
  overrides: Record<string, unknown> = {},
): TBlock {
  return {
    _type: 'block',
    _key: nextKey('block'),
    style: 'normal',
    ...overrides,
  } as TBlock;
}

export function mockPortableTextBody(text: string): TPortableTextNode[] {
  return [
    {
      _type: 'block',
      _key: 'body-1',
      children: [{ _type: 'span', _key: 'body-1-span', text, marks: [] }],
    },
  ];
}

export function mockLinkedPortableTextBody(
  text: string,
  href: string,
): TPortableTextNode[] {
  return [
    {
      _type: 'block',
      _key: 'linked-1',
      markDefs: [{ _type: 'link', _key: LINK_KEY, href }],
      children: [
        { _type: 'span', _key: 'linked-span', text, marks: [LINK_KEY] },
      ],
    },
  ];
}
