import { LINK_TYPE, routes } from '@blog/config';
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
import { faker } from '@faker-js/faker';

import { toLink, type TRawLink } from './to-link';

faker.seed(6021);

const MOCK_ACCESSIBLE_LABEL = faker.lorem.sentence();

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
  it('resolves an external link to its raw url', () => {
    const result = toLink(mockRawLink());

    expect(result).toEqual(mockLinkView());
  });

  it('labels the link for assistive tech with its accessible label', () => {
    const result = toLink(
      mockRawLink({ accessibleLabel: MOCK_ACCESSIBLE_LABEL }),
    );

    expect(result).toEqual(mockLinkView({ ariaLabel: MOCK_ACCESSIBLE_LABEL }));
  });

  it('opens external links in a new tab when flagged', () => {
    const result = toLink(mockRawLink({ openInNewTab: true }));

    expect(result).toEqual(mockLinkView({ target: '_blank' }));
  });

  it.each([
    { _type: 'page_post', slug: MOCK_POST_SLUG, href: MOCK_POST_HREF },
    {
      _type: 'blog_topic',
      slug: MOCK_TOPIC_SLUG,
      href: routes.topic(MOCK_TOPIC_SLUG),
    },
    { _type: 'page_landing', slug: MOCK_ABOUT_SLUG, href: MOCK_ABOUT_HREF },
    { _type: 'page_postIndex', slug: null, href: routes.blogIndex() },
  ] as const)(
    'resolves an internal $_type reference to its route',
    ({ _type, slug, href }) => {
      const result = toLink(
        mockRawLink({
          linkType: LINK_TYPE.INTERNAL,
          internalReference: { _type, slug },
        }),
      );

      expect(result).toEqual(mockLinkView({ href }));
    },
  );

  it.each([
    { input: 'null', raw: null },
    { input: 'undefined', raw: undefined },
    {
      input: 'a page_post reference with no slug',
      raw: mockRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: { _type: 'page_post', slug: null },
      }),
    },
    {
      input: 'an internal link with no reference and no url',
      raw: mockRawLink({
        linkType: LINK_TYPE.INTERNAL,
        internalReference: null,
        url: null,
      }),
    },
  ])('returns undefined for $input', ({ raw }) => {
    const result = toLink(raw);

    expect(result).toBeUndefined();
  });
});
