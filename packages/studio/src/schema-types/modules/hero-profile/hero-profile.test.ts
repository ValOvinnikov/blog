import { getField } from '@blog/studio/testing/get-field';
import { getHidden } from '@blog/studio/testing/get-field-hidden';

import { heroProfileSchema } from './hero-profile';

describe('heroProfileSchema eyebrow field', () => {
  it('is hidden unless Show Role is off', () => {
    const hidden = getHidden(getField(heroProfileSchema, 'eyebrow'));

    expect(hidden({ parent: { showRole: true } })).toBe(true);
    expect(hidden({ parent: { showRole: undefined } })).toBe(true);
    expect(hidden({ parent: { showRole: false } })).toBe(false);
  });
});

describe('heroProfileSchema preview', () => {
  const prepare = heroProfileSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected heroProfileSchema to define preview.prepare.');
  }

  it.each([
    [
      { title: undefined, subtitle: undefined },
      { title: 'Unknown', subtitle: 'No heading yet' },
    ],
    [
      { title: 'Home Profile Hero', subtitle: 'Meet Jane.' },
      { title: 'Home Profile Hero', subtitle: 'Meet Jane.' },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
