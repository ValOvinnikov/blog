import type { TPortableTextContent } from '@blog/email/portable-text';

const LINK_KEY = 'linked-link';

export function mockPortableTextBody(text: string): TPortableTextContent {
  return [
    {
      _type: 'block',
      _key: 'body-1',
      style: 'normal',
      children: [{ _type: 'span', _key: 'body-1-span', text, marks: [] }],
    },
  ];
}

export function mockLinkedPortableTextBody(
  text: string,
  href: string,
): TPortableTextContent {
  return [
    {
      _type: 'block',
      _key: 'linked-1',
      style: 'normal',
      markDefs: [{ _type: 'link', _key: LINK_KEY, href }],
      children: [
        { _type: 'span', _key: 'linked-span', text, marks: [LINK_KEY] },
      ],
    },
  ];
}
