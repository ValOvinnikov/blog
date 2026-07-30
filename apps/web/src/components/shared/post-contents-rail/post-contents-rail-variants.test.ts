import { postContentsRailVariants } from './post-contents-rail-variants';

describe('postContentsRailVariants', () => {
  it('adds a bottom margin after the mobile disclosure, so the article body below it has a visible gap', () => {
    const { mobile } = postContentsRailVariants();

    expect(mobile()).toContain('mb-6');
  });

  it('sizes the rail list copy at the readable text-copy token, not the smaller text-label', () => {
    const { list } = postContentsRailVariants();

    expect(list()).toContain('text-copy');
    expect(list()).not.toContain('text-label');
  });
});
