import { TLINK_TYPE } from '@blog/config';
import { describe, expect, it } from 'vitest';

import { toLink, type TRawLink } from './to-link';

function makeRawLink(overrides: Partial<TRawLink> = {}): TRawLink {
  return {
    label: 'Learn more',
    linkType: TLINK_TYPE.EXTERNAL,
    url: '/newsletter',
    internalReference: null,
    openInNewTab: null,
    platform: null,
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
    });
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
        linkType: TLINK_TYPE.INTERNAL,
        internalReference: { _type: 'blog_post', slug: 'hello-world' },
      }),
    );

    expect(result?.href).toBe('/blog/hello-world');
  });

  it('resolves an internal blog_category reference to its category route', () => {
    const result = toLink(
      makeRawLink({
        linkType: TLINK_TYPE.INTERNAL,
        internalReference: { _type: 'blog_category', slug: 'engineering' },
      }),
    );

    expect(result?.href).toBe('/category/engineering');
  });

  it('resolves an internal page_generic reference to its generic-page route', () => {
    const result = toLink(
      makeRawLink({
        linkType: TLINK_TYPE.INTERNAL,
        internalReference: { _type: 'page_generic', slug: 'about' },
      }),
    );

    expect(result?.href).toBe('/about');
  });

  it('resolves an internal page_blog reference to the blog index — no slug required', () => {
    const result = toLink(
      makeRawLink({
        linkType: TLINK_TYPE.INTERNAL,
        internalReference: { _type: 'page_blog', slug: null },
      }),
    );

    expect(result?.href).toBe('/blog');
  });

  it('returns undefined when a slug-having internal reference is genuinely missing its slug', () => {
    const result = toLink(
      makeRawLink({
        linkType: TLINK_TYPE.INTERNAL,
        internalReference: { _type: 'blog_post', slug: null },
      }),
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when an internal link has no reference and no url', () => {
    const result = toLink(
      makeRawLink({
        linkType: TLINK_TYPE.INTERNAL,
        internalReference: null,
        url: null,
      }),
    );

    expect(result).toBeUndefined();
  });
});
