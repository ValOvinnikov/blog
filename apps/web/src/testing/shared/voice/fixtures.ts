import type { TVoicePortableText } from '@blog/config';

export const makeFormattedVoiceRich = ({
  linkText = 'a link',
  href = '/blog',
}: { linkText?: string; href?: string } = {}): TVoicePortableText => [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    markDefs: [{ _type: 'link', _key: 'l1', href }],
    children: [
      { _type: 'span', _key: 's1', text: 'Try ' },
      { _type: 'span', _key: 's2', text: 'bold', marks: ['strong'] },
      { _type: 'span', _key: 's3', text: ', ' },
      { _type: 'span', _key: 's4', text: 'italic', marks: ['em'] },
      { _type: 'span', _key: 's5', text: ' or ' },
      { _type: 'span', _key: 's6', text: linkText, marks: ['l1'] },
    ],
  },
];
