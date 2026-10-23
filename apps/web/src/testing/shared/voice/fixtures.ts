import type { TVoicePortableText } from '@blog/config';

export const MOCK_VOICE_LINK_TEXT = 'a link';
export const MOCK_VOICE_LINK_HREF = '/blog';
export const MOCK_VOICE_BOLD_TEXT = 'bold';
export const MOCK_VOICE_ITALIC_TEXT = 'italic';

export const mockFormattedVoiceRich = ({
  linkText = MOCK_VOICE_LINK_TEXT,
  href = MOCK_VOICE_LINK_HREF,
}: { linkText?: string; href?: string } = {}): TVoicePortableText => [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    markDefs: [{ _type: 'link', _key: 'l1', href }],
    children: [
      { _type: 'span', _key: 's1', text: 'Try ' },
      {
        _type: 'span',
        _key: 's2',
        text: MOCK_VOICE_BOLD_TEXT,
        marks: ['strong'],
      },
      { _type: 'span', _key: 's3', text: ', ' },
      {
        _type: 'span',
        _key: 's4',
        text: MOCK_VOICE_ITALIC_TEXT,
        marks: ['em'],
      },
      { _type: 'span', _key: 's5', text: ' or ' },
      { _type: 'span', _key: 's6', text: linkText, marks: ['l1'] },
    ],
  },
];
