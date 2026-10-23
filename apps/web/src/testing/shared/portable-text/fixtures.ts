import {
  IMAGE_LAYOUT,
  PORTABLE_TEXT_BLOCK_TYPE,
  type TPortableTextBlock,
} from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';

export type TPortableTextSpan = TPortableTextBlock['children'][number];

let keySeq = 0;
const nextKey = (prefix: string) => `${prefix}-${keySeq++}`;

export const mockPortableTextSpan = (
  text: string,
  marks?: string[],
): TPortableTextSpan => ({
  _type: 'span',
  _key: nextKey('span'),
  text,
  ...(marks ? { marks } : {}),
});

export type TPortableTextBlockOptions = {
  style?: TPortableTextBlock['style'];
  marks?: string[];
  markDefs?: TPortableTextBlock['markDefs'];
  listItem?: TPortableTextBlock['listItem'];
  level?: TPortableTextBlock['level'];
  key?: string;
};

export const mockPortableTextBlock = (
  text: string | TPortableTextSpan[],
  options: TPortableTextBlockOptions = {},
): TPortableTextBlock => ({
  _type: 'block',
  _key: options.key ?? nextKey('block'),
  style: options.style ?? 'normal',
  children: Array.isArray(text)
    ? text
    : [mockPortableTextSpan(text, options.marks)],
  markDefs: options.markDefs,
  listItem: options.listItem,
  level: options.level,
});

/**
 * Multiple sibling block types back to back, so any missing vertical
 * spacing between sibling blocks is immediately visible.
 */
export const MOCK_RICH_TEXT_DEMO: TPortableTextBody = [
  mockPortableTextBlock(
    'This story renders several sibling blocks back to back, so any missing vertical rhythm between them is immediately visible.',
  ),
  mockPortableTextBlock('A section heading', { style: 'h2' }),
  mockPortableTextBlock(
    [
      mockPortableTextSpan('A paragraph with '),
      mockPortableTextSpan('bold', ['strong']),
      mockPortableTextSpan(', '),
      mockPortableTextSpan('italic', ['em']),
      mockPortableTextSpan(', and '),
      mockPortableTextSpan('inline code', ['code']),
      mockPortableTextSpan(' marks.'),
    ],
    { style: 'normal' },
  ),
  mockPortableTextBlock('A subsection heading', { style: 'h3' }),
  mockPortableTextBlock('A paragraph nested under the subsection heading.'),
  mockPortableTextBlock('A nested subsection heading', { style: 'h4' }),
  mockPortableTextBlock(
    'A paragraph nested under the deepest heading level, demonstrating the step-down sizing from h2 through h4.',
  ),
  mockPortableTextBlock(
    [
      mockPortableTextSpan('A second paragraph with a '),
      mockPortableTextSpan('link', ['link-1']),
      mockPortableTextSpan(' in it.'),
    ],
    {
      markDefs: [
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
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
  mockPortableTextBlock(
    'A paragraph after the code block, before an inline image.',
  ),
  {
    _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
    _key: nextKey('image'),
    image: mockSanityImage({ alt: 'A scenic mountain range at sunset' }),
    layout: IMAGE_LAYOUT.FLOAT_LEFT,
  },
  mockPortableTextBlock(
    'A closing paragraph after the image, long enough to demonstrate text wrapping around the floated image above at the md breakpoint and wider. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  ),
];

export const MOCK_FULL_BLEED_IMAGE_DEMO: TPortableTextBody = [
  mockPortableTextBlock(
    'A paragraph before a full bleed image. Full bleed images break out of the text measure and reach both viewport edges.',
  ),
  {
    _type: PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE,
    _key: nextKey('image'),
    image: mockSanityImage({ alt: 'A panoramic mountain range' }),
    layout: IMAGE_LAYOUT.FULL_BLEED,
  },
  mockPortableTextBlock(
    'A paragraph after the full bleed image, continuing at the regular text measure.',
  ),
];
