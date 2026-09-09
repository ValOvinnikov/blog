import { toPostHeading } from './to-post-heading';

describe(toPostHeading, () => {
  it('maps heading and supportingText to title and excerpt', () => {
    const result = toPostHeading({
      heading: 'Hello World',
      supportingText: 'A sufficiently long excerpt for the card.',
    });

    expect(result).toEqual({
      title: 'Hello World',
      excerpt: 'A sufficiently long excerpt for the card.',
    });
  });

  it('leaves excerpt undefined when supportingText is null', () => {
    const result = toPostHeading({
      heading: 'Hello World',
      supportingText: null,
    });

    expect(result).toEqual({ title: 'Hello World', excerpt: undefined });
  });
});
