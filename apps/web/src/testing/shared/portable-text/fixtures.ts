import { IMAGE_LAYOUT, type TPortableText } from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

export type TPortableTextSpan = TPortableText['children'][number];

let keySeq = 0;
const nextKey = (prefix: string) => `${prefix}-${keySeq++}`;

export const portableTextSpan = (
  text: string,
  marks?: string[],
): TPortableTextSpan => ({
  _type: 'span',
  _key: nextKey('span'),
  text,
  ...(marks ? { marks } : {}),
});

export type TPortableTextBlockOptions = {
  style?: TPortableText['style'];
  marks?: string[];
  markDefs?: TPortableText['markDefs'];
  listItem?: TPortableText['listItem'];
  level?: TPortableText['level'];
  key?: string;
};

export const portableTextBlock = (
  text: string | TPortableTextSpan[],
  options: TPortableTextBlockOptions = {},
): TPortableText => ({
  _type: 'block',
  _key: options.key ?? nextKey('block'),
  style: options.style ?? 'normal',
  children: Array.isArray(text)
    ? text
    : [portableTextSpan(text, options.marks)],
  markDefs: options.markDefs,
  listItem: options.listItem,
  level: options.level,
});

/**
 * Multiple sibling block types back to back, so any missing vertical
 * spacing between sibling blocks is immediately visible.
 */
export const richTextDemo: TPortableTextBody = [
  portableTextBlock(
    'This story renders several sibling blocks back to back, so any missing vertical rhythm between them is immediately visible.',
  ),
  portableTextBlock('A section heading', { style: 'h2' }),
  portableTextBlock(
    [
      portableTextSpan('A paragraph with '),
      portableTextSpan('bold', ['strong']),
      portableTextSpan(', '),
      portableTextSpan('italic', ['em']),
      portableTextSpan(', and '),
      portableTextSpan('inline code', ['code']),
      portableTextSpan(' marks.'),
    ],
    { style: 'normal' },
  ),
  portableTextBlock('A subsection heading', { style: 'h3' }),
  portableTextBlock('A paragraph nested under the subsection heading.'),
  portableTextBlock('A nested subsection heading', { style: 'h4' }),
  portableTextBlock(
    'A paragraph nested under the deepest heading level, demonstrating the step-down sizing from h2 through h4.',
  ),
  portableTextBlock(
    [
      portableTextSpan('A second paragraph with a '),
      portableTextSpan('link', ['link-1']),
      portableTextSpan(' in it.'),
    ],
    {
      markDefs: [
        {
          _type: 'linkRef',
          _key: 'link-1',
          link: { href: 'https://example.com', target: undefined },
        },
      ],
    },
  ),
  {
    _type: 'code',
    _key: nextKey('code'),
    language: 'typescript',
    filename: 'example.ts',
    code: 'export const greet = (name: string) => `Hello, ${name}!`;',
  },
  portableTextBlock(
    'A paragraph after the code block, before an inline image.',
  ),
  {
    _type: 'bodyImage',
    _key: nextKey('image'),
    image: makeSanityImage({ alt: 'A scenic mountain range at sunset' }),
    layout: IMAGE_LAYOUT.FLOAT_LEFT,
  },
  portableTextBlock(
    'A closing paragraph after the image, long enough to demonstrate text wrapping around the floated image above at the md breakpoint and wider. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  ),
];
