import type { TVoicePortableText } from '@blog/config';
import { MOCK_PARAGRAPH_STYLE } from '@web/testing/shared/portable-text/fixtures';

const BLOCK_KEY = 'b1';
const FIRST_SPAN_KEY = 's1';

export const mockFormattedVoiceRich = ({
  linkText = 'a link',
  href = '/blog',
}: { linkText?: string; href?: string } = {}): TVoicePortableText => [
  {
    _type: 'block',
    _key: BLOCK_KEY,
    style: MOCK_PARAGRAPH_STYLE,
    markDefs: [{ _type: 'link', _key: 'l1', href }],
    children: [
      { _type: 'span', _key: FIRST_SPAN_KEY, text: 'Try ' },
      { _type: 'span', _key: 's2', text: 'bold', marks: ['strong'] },
      { _type: 'span', _key: 's3', text: ', ' },
      { _type: 'span', _key: 's4', text: 'italic', marks: ['em'] },
      { _type: 'span', _key: 's5', text: ' or ' },
      { _type: 'span', _key: 's6', text: linkText, marks: ['l1'] },
    ],
  },
];

export const mockVoiceRichText = (text: string): TVoicePortableText => [
  {
    _type: 'block',
    _key: BLOCK_KEY,
    style: MOCK_PARAGRAPH_STYLE,
    children: [{ _type: 'span', _key: FIRST_SPAN_KEY, text }],
  },
];
