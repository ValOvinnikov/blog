import type { TVoicePortableText } from '@blog/config';

import { resolveVoiceRichFields } from './resolve-voice-rich-fields';

const richTextOf = (text: string): TVoicePortableText => [
  {
    _type: 'block',
    _key: 'a',
    style: 'normal',
    children: [{ _type: 'span', _key: 'a1', text }],
  },
];

const BASE_MESSAGES = {
  blogListPage: { empty: 'No posts yet.' },
  topicPage: { empty: 'Nothing tagged {name} yet.' },
};

describe(resolveVoiceRichFields, () => {
  it('returns the stored override unflattened for a field that has one', () => {
    const override = richTextOf('Nothing published yet.');

    const result = resolveVoiceRichFields(
      { blogListEmpty: override },
      BASE_MESSAGES,
    );

    expect(result.blogListEmpty).toBe(override);
  });

  it('falls back to the catalog string wrapped as a single paragraph when no override exists', () => {
    const result = resolveVoiceRichFields({}, BASE_MESSAGES);

    expect(result.blogListEmpty).toEqual([
      {
        _type: 'block',
        _key: 'catalog-block',
        style: 'normal',
        children: [
          { _type: 'span', _key: 'catalog-span', text: 'No posts yet.' },
        ],
      },
    ]);
  });

  it('wraps a plain-string override the same way as a missing one', () => {
    const result = resolveVoiceRichFields(
      { topicEmpty: 'Nothing here.' },
      BASE_MESSAGES,
    );

    expect(result.topicEmpty).toEqual([
      {
        _type: 'block',
        _key: 'catalog-block',
        style: 'normal',
        children: [
          { _type: 'span', _key: 'catalog-span', text: 'Nothing here.' },
        ],
      },
    ]);
  });

  it('resolves every RICH voice field, not only the ones present in overrides', () => {
    const result = resolveVoiceRichFields({}, BASE_MESSAGES);

    expect(Object.keys(result)).toHaveLength(12);
    expect(result.accountIdentityDisplayNameDescription).toBeDefined();
  });
});
