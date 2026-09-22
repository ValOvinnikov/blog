import {
  makeRawExternalLinkDocument,
  makeRawInternalLinkDocument,
} from '@blog/service/testing/shared/fixtures';

import { toLinkDocument } from './to-link-document';

describe(toLinkDocument, () => {
  it('returns undefined for a null/undefined raw link', () => {
    expect(toLinkDocument(null)).toBeUndefined();
    expect(toLinkDocument(undefined)).toBeUndefined();
  });

  it('resolves an external link to its raw url', () => {
    const result = toLinkDocument(
      makeRawExternalLinkDocument({ url: 'https://example.com' }),
    );

    expect(result).toEqual({
      label: 'Learn more',
      href: 'https://example.com',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    });
  });

  it('opens external links in a new tab when flagged', () => {
    const result = toLinkDocument(
      makeRawExternalLinkDocument({
        url: 'https://example.com',
        openInNewTab: true,
      }),
    );

    expect(result?.target).toBe('_blank');
  });

  it('returns undefined for an external link with a missing url', () => {
    const result = toLinkDocument(makeRawExternalLinkDocument({ url: null }));

    expect(result).toBeUndefined();
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
        makeRawInternalLinkDocument({
          internalReference: { _type, slug: slug ?? null },
        }),
      );

      expect(result?.href).toBe(href);
    },
  );

  it('resolves a slugless page_postIndex reference without requiring a slug', () => {
    const result = toLinkDocument(
      makeRawInternalLinkDocument({
        internalReference: { _type: 'page_postIndex', slug: null },
      }),
    );

    expect(result?.href).toBe('/blog');
  });

  it('returns undefined when a slug-having internal reference is genuinely missing its slug', () => {
    const result = toLinkDocument(
      makeRawInternalLinkDocument({
        internalReference: { _type: 'page_post', slug: null },
      }),
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined for a dangling internal reference rather than throwing', () => {
    const result = toLinkDocument(
      makeRawInternalLinkDocument({ internalReference: null }),
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined for a dangling/unresolvable reference type', () => {
    const result = toLinkDocument(
      makeRawInternalLinkDocument({
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
