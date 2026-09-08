import type { TVoicePortableText } from '@blog/config';

/** Wraps a catalog string as the single-paragraph Portable Text shape a RICH voice field falls back to when no override is stored. */
export const wrapVoiceText = (text: string): TVoicePortableText => [
  {
    _type: 'block',
    _key: 'catalog-block',
    style: 'normal',
    children: [{ _type: 'span', _key: 'catalog-span', text }],
  },
];
