import { postContentsRailVariants } from './post-contents-rail-variants';

describe('postContentsRailVariants', () => {
  it('adds a bottom margin after the mobile disclosure, so the article body below it has a visible gap', () => {
    const { mobile } = postContentsRailVariants();

    expect(mobile()).toContain('mb-6');
  });

  it('pins the whole nav (not the inner mobile bar) below the sticky header at the same offset as the desktop rail, so it has room to stick against its own tall parent', () => {
    const { root, desktop } = postContentsRailVariants();

    expect(root()).toContain('sticky');
    expect(root()).toContain('top-24');
    expect(desktop()).toContain('lg:top-24');
  });

  it('cancels the root sticky positioning at lg, leaving the desktop grid-item behavior untouched', () => {
    const { root } = postContentsRailVariants();

    expect(root()).toContain('lg:static');
    expect(root()).toContain('lg:top-auto');
    expect(root()).toContain('lg:z-auto');
  });

  it('gives the mobile bar an opaque background and its own positioning context for the panel overlay', () => {
    const { mobile } = postContentsRailVariants();

    expect(mobile()).toContain('bg-bg');
    expect(mobile()).toContain('relative');
    expect(mobile()).not.toContain('sticky');
  });

  it('renders the expanded mobile panel as an absolutely positioned, opaque overlay so it does not push the article body down', () => {
    const { panel } = postContentsRailVariants();

    expect(panel()).toContain('absolute');
    expect(panel()).toContain('bg-bg');
  });

  it('sizes the rail list copy at the readable text-copy token, not the smaller text-label', () => {
    const { list } = postContentsRailVariants();

    expect(list()).toContain('text-copy');
    expect(list()).not.toContain('text-label');
  });
});
