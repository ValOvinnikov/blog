import type { TVoicePortableText } from '@blog/config';

import { plainTextVoiceOverrides } from './plain-text-voice-overrides';

describe(plainTextVoiceOverrides, () => {
  it('passes string-valued entries through unchanged', () => {
    expect(
      plainTextVoiceOverrides({
        notFoundHeading: 'Page not found',
        notFoundReturnHome: 'Return home',
      }),
    ).toEqual({
      notFoundHeading: 'Page not found',
      notFoundReturnHome: 'Return home',
    });
  });

  it('projects a stored rich (Portable Text) value to its plain text rather than dropping it', () => {
    const richValue: TVoicePortableText = [
      {
        _type: 'block',
        _key: 'k1',
        style: 'normal',
        children: [{ _type: 'span', _key: 's1', text: 'Nothing here.' }],
      },
    ];

    expect(
      plainTextVoiceOverrides({
        notFoundHeading: 'Page not found',
        blogListEmpty: richValue,
      }),
    ).toEqual({
      notFoundHeading: 'Page not found',
      blogListEmpty: 'Nothing here.',
    });
  });

  it('projects a multi-block rich value the same way apps/web applyVoiceOverrides would', () => {
    const richValue: TVoicePortableText = [
      {
        _type: 'block',
        _key: 'k1',
        style: 'normal',
        children: [{ _type: 'span', _key: 's1', text: 'First block.' }],
      },
      {
        _type: 'block',
        _key: 'k2',
        style: 'normal',
        children: [{ _type: 'span', _key: 's2', text: 'Second block.' }],
      },
    ];

    expect(plainTextVoiceOverrides({ blogListEmpty: richValue })).toEqual({
      blogListEmpty: 'First block. Second block.',
    });
  });

  it('returns an empty object for an empty map', () => {
    expect(plainTextVoiceOverrides({})).toEqual({});
  });
});
