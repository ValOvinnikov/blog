import { LINK_TYPE } from '@blog/config';

import { toLink, type TRawLink } from './to-link';

function makeRawLink(overrides: Partial<TRawLink> = {}): TRawLink {
  return {
    label: 'Learn more',
    linkType: LINK_TYPE.EXTERNAL,
    url: '/newsletter',
    internalReference: null,
    openInNewTab: null,
    platform: null,
    accessibleLabel: null,
    ...overrides,
  };
}

describe('toLink', () => {
  it('returns undefined for a null/undefined raw link', () => {
    expect(toLink(null)).toBeUndefined();
    expect(toLink(undefined)).toBeUndefined();
  });

  it('resolves an external link to its raw url', () => {
    const result = toLink(makeRawLink({ url: 'https://example.com' }));

    expect(result).toEqual({
      label: 'Learn more',
      href: 'https://example.com',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    });
  });

  it('threads accessibleLabel through to ariaLabel when present', () => {
    const result = toLink(
      makeRawLink({ accessibleLabel: 'Read the full announcement' }),
    );

    expect(result?.ariaLabel).toBe('Read the full announcement');
  });

  it('leaves ariaLabel undefined when accessibleLabel is absent', () => {
    const result = toLink(makeRawLink({ accessibleLabel: null }));

    expect(result?.ariaLabel).toBeUndefined();
  });

  it('opens external links in a new tab when flagged', () => {
    const result = toLink(
      makeRawLink({ url: 'https://example.com', openInNewTab: true }),
    );

    expect(result?.target).toBe('_blank');
  });

  it('resolves an internal blog_post reference to its post route', () => {
    const result = toLink(
      makeRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'blog_post', slug: 'hello-world' },
      }),
    );

    expect(result?.href).toBe('/blog/hello-world');
  });

  it('resolves an internal blog_topic reference to its topic route', () => {
    const result = toLink(
      makeRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'blog_topic', slug: 'engineering' },
      }),
    );

    expect(result?.href).toBe('/topics/engineering');
  });

  it('resolves an internal page_generic reference to its generic-page route', () => {
    const result = toLink(
      makeRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'page_generic', slug: 'about' },
      }),
    );

    expect(result?.href).toBe('/about');
  });

  it('resolves an internal page_blog reference to the blog index — no slug required', () => {
    const result = toLink(
      makeRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'page_blog', slug: null },
      }),
    );

    expect(result?.href).toBe('/blog');
  });

  it('returns undefined when a slug-having internal reference is genuinely missing its slug', () => {
    const result = toLink(
      makeRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'blog_post', slug: null },
      }),
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when an internal link has no reference and no url', () => {
    const result = toLink(
      makeRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: null,
        url: null,
      }),
    );

    expect(result).toBeUndefined();
  });
});
