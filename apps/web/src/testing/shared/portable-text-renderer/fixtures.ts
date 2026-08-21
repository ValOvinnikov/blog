import { IMAGE_LAYOUT, type RichText } from '@blog/config';

export type TRichTextBlock = Extract<RichText[number], { _type: 'block' }>;
export type TRichTextSpan = NonNullable<TRichTextBlock['children']>[number];

let keySeq = 0;
const nextKey = (prefix: string) => `${prefix}-${keySeq++}`;

export const richTextSpan = (
  text: string,
  marks?: string[],
): TRichTextSpan => ({
  _type: 'span',
  _key: nextKey('span'),
  text,
  ...(marks ? { marks } : {}),
});

export const richTextBlock = (
  style: TRichTextBlock['style'],
  children: TRichTextSpan[],
  markDefs?: TRichTextBlock['markDefs'],
): TRichTextBlock => ({
  _type: 'block',
  _key: nextKey('block'),
  style,
  children,
  ...(markDefs ? { markDefs } : {}),
});

/**
 * Multiple sibling block types back to back (heading, paragraphs, marks, a
 * code block) — exercises the layout regression this component fixes:
 * missing vertical spacing between sibling blocks, which renders as one
 * unbroken block of text.
 */
export const richTextDemo: RichText = [
  richTextBlock('normal', [
    richTextSpan(
      'This story renders several sibling blocks back to back, so any missing vertical rhythm between them is immediately visible.',
    ),
  ]),
  richTextBlock('h2', [richTextSpan('A section heading')]),
  richTextBlock('normal', [
    richTextSpan('A paragraph with '),
    richTextSpan('bold', ['strong']),
    richTextSpan(', '),
    richTextSpan('italic', ['em']),
    richTextSpan(', and '),
    richTextSpan('inline code', ['code']),
    richTextSpan(' marks.'),
  ]),
  richTextBlock('h3', [richTextSpan('A subsection heading')]),
  richTextBlock('normal', [
    richTextSpan('A paragraph nested under the subsection heading.'),
  ]),
  richTextBlock('h4', [richTextSpan('A nested subsection heading')]),
  richTextBlock('normal', [
    richTextSpan(
      'A paragraph nested under the deepest heading level, demonstrating the step-down sizing from h2 through h4.',
    ),
  ]),
  richTextBlock(
    'normal',
    [
      richTextSpan('A second paragraph with a '),
      richTextSpan('link', ['link-1']),
      richTextSpan(' in it.'),
    ],
    [{ _type: 'link', _key: 'link-1', href: 'https://example.com' }],
  ),
  {
    _type: 'code',
    _key: nextKey('code'),
    language: 'typescript',
    filename: 'example.ts',
    code: 'export const greet = (name: string) => `Hello, ${name}!`;',
  },
  richTextBlock('normal', [
    richTextSpan('A paragraph after the code block, before an inline image.'),
  ]),
  {
    _type: 'bodyImage',
    _key: nextKey('image'),
    asset: {
      _ref: 'image-6205dacc42424f7a83d8e20a7000d895f7cdc7dd-2400x1260-png',
      _type: 'reference',
    },
    alt: 'A scenic mountain range at sunset',
    // A non-default layout (rather than the more common INLINE) so this
    // fixture also exercises the floated width/wrap treatment, not just the
    // full-width default.
    layout: IMAGE_LAYOUT.FLOAT_LEFT,
  },
  richTextBlock('normal', [
    richTextSpan(
      'A closing paragraph after the image, long enough to demonstrate text wrapping around the floated image above at the md breakpoint and wider. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    ),
  ]),
];
