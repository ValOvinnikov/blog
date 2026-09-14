import {
  makeRawLinkRef,
  makeRawSharedLink,
} from '@blog/service/testing/shared/fixtures';

import { toLink } from './to-link';

describe('toLink', () => {
  it('returns undefined for a null/undefined raw wrapper', () => {
    expect(toLink(null)).toBeUndefined();
    expect(toLink(undefined)).toBeUndefined();
  });

  it('returns undefined when the shared link reference is dangling', () => {
    const result = toLink(makeRawLinkRef({ link: null }));

    expect(result).toBeUndefined();
  });

  it('resolves an external link to its raw url', () => {
    const result = toLink(
      makeRawLinkRef({
        link: makeRawSharedLink({ url: 'https://example.com' }),
      }),
    );

    expect(result).toEqual({
      label: 'Learn more',
      href: 'https://example.com',
      target: undefined,
      platform: undefined,
    });
  });

  it("uses labelOverride instead of the shared link's own label when set", () => {
    const result = toLink(makeRawLinkRef({ labelOverride: 'Read this' }));

    expect(result?.label).toBe('Read this');
  });

  it("falls back to the shared link's own label when labelOverride is absent", () => {
    const result = toLink(makeRawLinkRef({ labelOverride: null }));

    expect(result?.label).toBe('Learn more');
  });

  it('opens external links in a new tab when flagged', () => {
    const result = toLink(
      makeRawLinkRef({
        link: makeRawSharedLink({
          url: 'https://example.com',
          openInNewTab: true,
        }),
      }),
    );

    expect(result?.target).toBe('_blank');
  });

  it('resolves an internal page_post reference to its post route', () => {
    const result = toLink(
      makeRawLinkRef({
        link: makeRawSharedLink({
          linkType: 'INTERNAL',
          internalReference: { _type: 'page_post', slug: 'hello-world' },
        }),
      }),
    );

    expect(result?.href).toBe('/blog/hello-world');
  });

  it('resolves an internal blog_topic reference to its topic route', () => {
    const result = toLink(
      makeRawLinkRef({
        link: makeRawSharedLink({
          linkType: 'INTERNAL',
          internalReference: { _type: 'blog_topic', slug: 'engineering' },
        }),
      }),
    );

    expect(result?.href).toBe('/topics/engineering');
  });

  it('resolves an internal page_landing reference to its landing-page route', () => {
    const result = toLink(
      makeRawLinkRef({
        link: makeRawSharedLink({
          linkType: 'INTERNAL',
          internalReference: { _type: 'page_landing', slug: 'about' },
        }),
      }),
    );

    expect(result?.href).toBe('/about');
  });

  it('resolves an internal page_postIndex reference to the blog index — no slug required', () => {
    const result = toLink(
      makeRawLinkRef({
        link: makeRawSharedLink({
          linkType: 'INTERNAL',
          internalReference: { _type: 'page_postIndex', slug: null },
        }),
      }),
    );

    expect(result?.href).toBe('/blog');
  });

  it('returns undefined when a slug-having internal reference is genuinely missing its slug', () => {
    const result = toLink(
      makeRawLinkRef({
        link: makeRawSharedLink({
          linkType: 'INTERNAL',
          internalReference: { _type: 'page_post', slug: null },
        }),
      }),
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when an internal link has no reference and no url', () => {
    const result = toLink(
      makeRawLinkRef({
        link: makeRawSharedLink({
          linkType: 'INTERNAL',
          internalReference: null,
          url: null,
        }),
      }),
    );

    expect(result).toBeUndefined();
  });
});
