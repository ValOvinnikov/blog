import { heroStatementSchema } from './hero-statement';

describe('heroStatementSchema preview', () => {
  const prepare = heroStatementSchema.preview?.prepare;

  if (!prepare) {
    throw new Error('Expected heroStatementSchema to define preview.prepare.');
  }

  it.each([
    [
      { title: undefined, subtitle: undefined },
      { title: 'Unknown', subtitle: 'No heading yet' },
    ],
    [
      { title: 'Home Statement Hero', subtitle: 'We build things.' },
      { title: 'Home Statement Hero', subtitle: 'We build things.' },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare(input)).toEqual(expected);
  });
});
