import { heroProfileSchema } from './hero-profile';

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
