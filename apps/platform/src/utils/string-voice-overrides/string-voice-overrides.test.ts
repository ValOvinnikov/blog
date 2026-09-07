import type { TVoicePortableText } from '@blog/config';

import { stringVoiceOverrides } from './string-voice-overrides';

describe(stringVoiceOverrides, () => {
  it('passes string-valued entries through unchanged', () => {
    expect(
      stringVoiceOverrides({
        notFoundHeading: 'Page not found',
        notFoundReturnHome: 'Return home',
      }),
    ).toEqual({
      notFoundHeading: 'Page not found',
      notFoundReturnHome: 'Return home',
    });
  });

  it('drops a rich (Portable Text) value rather than passing it through', () => {
    const richValue: TVoicePortableText = [
      {
        _type: 'block',
        _key: 'k1',
        style: 'normal',
        children: [{ _type: 'span', _key: 's1', text: 'Nothing here.' }],
      },
    ];

    expect(
      stringVoiceOverrides({
        notFoundHeading: 'Page not found',
        blogListEmpty: richValue,
      }),
    ).toEqual({ notFoundHeading: 'Page not found' });
  });

  it('returns an empty object for an empty map', () => {
    expect(stringVoiceOverrides({})).toEqual({});
  });
});
