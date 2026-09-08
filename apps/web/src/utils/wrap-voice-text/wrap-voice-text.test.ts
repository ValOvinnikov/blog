import { wrapVoiceText } from './wrap-voice-text';

describe(wrapVoiceText, () => {
  it('wraps the given text as a single normal-style paragraph block', () => {
    const result = wrapVoiceText('Nothing here yet.');

    expect(result).toEqual([
      {
        _type: 'block',
        _key: 'catalog-block',
        style: 'normal',
        children: [
          { _type: 'span', _key: 'catalog-span', text: 'Nothing here yet.' },
        ],
      },
    ]);
  });

  it('wraps an empty string the same way, rather than an empty array', () => {
    const result = wrapVoiceText('');

    expect(result).toHaveLength(1);
    expect(result[0]?.children[0]?.text).toBe('');
  });
});
