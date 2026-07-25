export {};

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(),
}));

const { config } = await import('./proxy');

function buildMatcherRegExp() {
  return new RegExp(`^${config.matcher}$`);
}

describe('proxy matcher', () => {
  it('excludes root-level Next.js metadata-file routes from locale rewriting', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/icon')).toBe(false);
    expect(matcher.test('/opengraph-image')).toBe(false);
    expect(matcher.test('/twitter-image')).toBe(false);
  });

  it('still rewrites real content routes through locale middleware', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/')).toBe(true);
    expect(matcher.test('/blog')).toBe(true);
    expect(matcher.test('/blog/some-post-slug')).toBe(true);
  });

  it('still excludes the pre-existing api/_next/_vercel and dotted-extension paths', () => {
    const matcher = buildMatcherRegExp();

    expect(matcher.test('/api/whatever')).toBe(false);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
    expect(matcher.test('/_vercel/insights')).toBe(false);
    expect(matcher.test('/robots.txt')).toBe(false);
    expect(matcher.test('/favicon.ico')).toBe(false);
  });

  it('documents the prefix-match caveat: sibling paths sharing an excluded prefix also bypass locale middleware', () => {
    const matcher = buildMatcherRegExp();

    // The exclusion is prefix-based, not exact-segment, so `/icons` and
    // `/icon-something` also fail to match here (and thus bypass locale
    // rewriting) even though they are not metadata-file routes — a
    // pre-existing limitation shared with the `api`/`_next`/`_vercel`
    // exclusions, just extended to the three new names.
    expect(matcher.test('/icons')).toBe(false);
    expect(matcher.test('/icon-something')).toBe(false);
  });
});
