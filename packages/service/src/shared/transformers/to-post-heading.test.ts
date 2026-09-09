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

  it('leaves title and excerpt undefined when sectionHeader is null', () => {
    expect(toPostHeading(null)).toEqual({
      title: undefined,
      excerpt: undefined,
    });
  });

  it('leaves title and excerpt undefined when sectionHeader is undefined', () => {
    expect(toPostHeading(undefined)).toEqual({
      title: undefined,
      excerpt: undefined,
    });
  });
});
