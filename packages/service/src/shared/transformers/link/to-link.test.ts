import { LINK_TYPE } from '@blog/config';
import { MOCK_TOPIC_SLUG } from '@blog/service/testing/entities/fixtures';
import {
  MOCK_EXTERNAL_URL,
  MOCK_LINK_LABEL,
  MOCK_POST_HREF,
  MOCK_POST_SLUG,
  mockLinkView,
} from '@blog/service/testing/shared/fixtures';
import {
  MOCK_ABOUT_HREF,
  MOCK_ABOUT_SLUG,
} from '@blog/service/testing/shared/translated-pages-dataset';

import { toLink, type TRawLink } from './to-link';

const ACCESSIBLE_LABEL = 'Read the full announcement';

function mockRawLink(overrides: Partial<TRawLink> = {}): TRawLink {
  return {
    label: MOCK_LINK_LABEL,
    linkType: LINK_TYPE.EXTERNAL,
    url: MOCK_EXTERNAL_URL,
    internalReference: null,
    openInNewTab: null,
    platform: null,
    accessibleLabel: null,
    ...overrides,
  };
}

describe(toLink, () => {
  it.each([null, undefined])('returns undefined for a %s raw link', (raw) => {
    const result = toLink(raw);

    expect(result).toBeUndefined();
  });

  it('resolves an external link to its raw url', () => {
    const result = toLink(mockRawLink());

    expect(result).toEqual(mockLinkView());
  });

  it('threads accessibleLabel through to ariaLabel when present', () => {
    const result = toLink(mockRawLink({ accessibleLabel: ACCESSIBLE_LABEL }));

    expect(result?.ariaLabel).toBe(ACCESSIBLE_LABEL);
  });

  it('opens external links in a new tab when flagged', () => {
    const result = toLink(mockRawLink({ openInNewTab: true }));

    expect(result?.target).toBe('_blank');
  });

  it.each([
    { _type: 'page_post', slug: MOCK_POST_SLUG, href: MOCK_POST_HREF },
    { _type: 'blog_topic', slug: MOCK_TOPIC_SLUG, href: '/topics/engineering' },
    { _type: 'page_landing', slug: MOCK_ABOUT_SLUG, href: MOCK_ABOUT_HREF },
    { _type: 'page_postIndex', slug: null, href: '/blog' },
  ] as const)(
    'resolves an internal $_type reference to its route',
    ({ _type, slug, href }) => {
      const result = toLink(
        mockRawLink({
          linkType: LINK_TYPE.INTERNAL,
          internalReference: { _type, slug },
        }),
      );

      expect(result?.href).toBe(href);
    },
  );

  it('returns undefined for a page_post reference missing its slug', () => {
    const result = toLink(
      mockRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'page_post', slug: null },
      }),
    );

    expect(result).toBeUndefined();
  });

  it('returns undefined when an internal link has no reference and no url', () => {
    const result = toLink(
      mockRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: null,
        url: null,
      }),
    );

    expect(result).toBeUndefined();
  });
});
