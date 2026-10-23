import { MOCK_TOPIC_SLUG } from '@blog/service/testing/entities/fixtures';
import {
  MOCK_POST_HREF,
  MOCK_POST_SLUG,
  mockLinkView,
  mockRawExternalLinkDocument,
  mockRawInternalLinkDocument,
} from '@blog/service/testing/shared/fixtures';
import {
  MOCK_ABOUT_HREF,
  MOCK_ABOUT_SLUG,
} from '@blog/service/testing/shared/translated-pages-dataset';

import { toLinkDocument } from './to-link-document';

const EXTERNAL_URL = 'https://example.com/docs';

describe(toLinkDocument, () => {
  it.each([null, undefined])('returns undefined for a %s raw link', (raw) => {
    const result = toLinkDocument(raw);

    expect(result).toBeUndefined();
  });

  it('resolves an external link to its raw url', () => {
    const result = toLinkDocument(
      mockRawExternalLinkDocument({ url: EXTERNAL_URL }),
    );

    expect(result).toEqual(mockLinkView({ href: EXTERNAL_URL }));
  });

  it('opens external links in a new tab when flagged', () => {
    const result = toLinkDocument(
      mockRawExternalLinkDocument({ openInNewTab: true }),
    );

    expect(result?.target).toBe('_blank');
  });

  it('returns undefined for an external link with a missing url', () => {
    const result = toLinkDocument(mockRawExternalLinkDocument({ url: null }));

    expect(result).toBeUndefined();
  });

  it.each([
    { _type: 'page_home', slug: undefined, href: '/' },
    { _type: 'page_landing', slug: MOCK_ABOUT_SLUG, href: MOCK_ABOUT_HREF },
    { _type: 'page_post', slug: MOCK_POST_SLUG, href: MOCK_POST_HREF },
    { _type: 'page_postIndex', slug: undefined, href: '/blog' },
    { _type: 'page_topic', slug: MOCK_TOPIC_SLUG, href: '/topics/engineering' },
    { _type: 'page_topicIndex', slug: undefined, href: '/topics' },
    { _type: 'page_tag', slug: 'news', href: '/tags/news' },
    { _type: 'page_tagIndex', slug: undefined, href: '/tags' },
  ] as const)(
    'resolves an internal $_type reference to its route',
    ({ _type, slug, href }) => {
      const result = toLinkDocument(
        mockRawInternalLinkDocument({
          internalReference: { _type, slug: slug ?? null },
        }),
      );

      expect(result?.href).toBe(href);
    },
  );

  it.each([{ _type: 'page_post' }, { _type: 'page_landing' }] as const)(
    'returns undefined for a $_type reference missing its slug',
    ({ _type }) => {
      const result = toLinkDocument(
        mockRawInternalLinkDocument({
          internalReference: { _type, slug: null },
        }),
      );

      expect(result).toBeUndefined();
    },
  );

  it('returns undefined for a dangling internal reference', () => {
    const result = toLinkDocument(
      mockRawInternalLinkDocument({ internalReference: null }),
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when the link has no label in any language', () => {
    const result = toLinkDocument(mockRawInternalLinkDocument({ label: null }));

    expect(result).toBeUndefined();
  });
});
