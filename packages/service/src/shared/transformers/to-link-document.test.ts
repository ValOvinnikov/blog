import { LINK_TYPE } from '@blog/config';

import { toLinkDocument, type TRawLinkDocument } from './to-link-document';

function makeRawLinkDocument(
  overrides: Partial<TRawLinkDocument> = {},
): TRawLinkDocument {
  return {
    label: 'Subscribe',
    linkType: LINK_TYPE.EXTERNAL,
    url: '/newsletter',
    internalReference: null,
    openInNewTab: null,
    ...overrides,
  };
}

describe('toLinkDocument', () => {
  it('returns undefined for a null/undefined raw link', () => {
    expect(toLinkDocument(null)).toBeUndefined();
    expect(toLinkDocument(undefined)).toBeUndefined();
  });

  it('resolves an external link to its raw url', () => {
    const result = toLinkDocument(
      makeRawLinkDocument({ url: 'https://example.com' }),
    );

    expect(result).toEqual({
      label: 'Subscribe',
      href: 'https://example.com',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    });
  });

  it('opens external links in a new tab when flagged', () => {
    const result = toLinkDocument(
      makeRawLinkDocument({ url: 'https://example.com', openInNewTab: true }),
    );

    expect(result?.target).toBe('_blank');
  });

  it.each([
    ['page_home', undefined, '/'],
    ['page_landing', 'about', '/about'],
    ['page_post', 'hello-world', '/blog/hello-world'],
    ['page_postIndex', undefined, '/blog'],
    ['page_topic', 'engineering', '/topics/engineering'],
    ['page_topicIndex', undefined, '/topics'],
    ['page_tag', 'news', '/tags/news'],
    ['page_tagIndex', undefined, '/tags'],
  ] as const)(
    'resolves an internal %s reference to its route',
    (_type, slug, href) => {
      const result = toLinkDocument(
        makeRawLinkDocument({
          linkType: LINK_TYPE.INTERNAL,
          internalReference: { _type, slug: slug ?? null },
        }),
      );

      expect(result?.href).toBe(href);
    },
  );

  it('resolves a slugless page_postIndex reference without requiring a slug', () => {
    const result = toLinkDocument(
      makeRawLinkDocument({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'page_postIndex', slug: null },
      }),
    );

    expect(result?.href).toBe('/blog');
  });

  it('returns undefined when a slug-having internal reference is genuinely missing its slug', () => {
    const result = toLinkDocument(
      makeRawLinkDocument({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'page_post', slug: null },
      }),
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when an internal link has no reference and no url', () => {
    const result = toLinkDocument(
      makeRawLinkDocument({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: null,
        url: null,
      }),
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined for a dangling/unresolvable reference type', () => {
    const result = toLinkDocument(
      makeRawLinkDocument({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: {
          // @ts-expect-error — simulating a reference target outside the known union (schema drift).
          _type: 'page_unknown',
          slug: 'whatever',
        },
      }),
    );

    expect(result).toBeUndefined();
  });
});
