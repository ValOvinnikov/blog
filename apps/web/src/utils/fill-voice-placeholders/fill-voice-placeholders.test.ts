import type { TVoicePortableText } from '@blog/config';

import { fillVoicePlaceholders } from './fill-voice-placeholders';

const valueOf = (...texts: string[]): TVoicePortableText => [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    children: texts.map((text, index) => ({
      _type: 'span',
      _key: `s${index}`,
      text,
    })),
  },
];

describe(fillVoicePlaceholders, () => {
  it('replaces each placeholder with its param in every span', () => {
    const result = fillVoicePlaceholders(
      valueOf('No posts in {name}', ' — {name} is quiet.'),
      { name: 'News' },
    );

    expect(result[0]?.children.map(({ text }) => text)).toEqual([
      'No posts in News',
      ' — News is quiet.',
    ]);
  });

  it('leaves a placeholder with no matching param untouched', () => {
    const result = fillVoicePlaceholders(valueOf('Hello {who}'), {
      name: 'News',
    });

    expect(result[0]?.children[0]?.text).toBe('Hello {who}');
  });

  it('keeps the marks on a span it fills', () => {
    const value: TVoicePortableText = [
      {
        _type: 'block',
        _key: 'b1',
        style: 'normal',
        children: [
          { _type: 'span', _key: 's0', text: '{name}', marks: ['strong'] },
        ],
      },
    ];

    const result = fillVoicePlaceholders(value, { name: 'News' });

    expect(result[0]?.children[0]).toEqual({
      _type: 'span',
      _key: 's0',
      text: 'News',
      marks: ['strong'],
    });
  });
});
