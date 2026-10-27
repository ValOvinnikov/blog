import { routes } from '@blog/config';
import {
  MOCK_TAG_SLUG,
  MOCK_TOPIC_SLUG,
} from '@blog/service/testing/entities/fixtures';
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
import { faker } from '@faker-js/faker';

import { toLinkDocument } from './to-link-document';

faker.seed(6020);

const MOCK_URL = faker.internet.url();

describe(toLinkDocument, () => {
  it('resolves an external link to its raw url', () => {
    const result = toLinkDocument(
      mockRawExternalLinkDocument({ url: MOCK_URL }),
    );

    expect(result).toEqual(mockLinkView({ href: MOCK_URL }));
  });

  it('opens external links in a new tab when flagged', () => {
    const result = toLinkDocument(
      mockRawExternalLinkDocument({ openInNewTab: true }),
    );

    expect(result).toEqual(mockLinkView({ target: '_blank' }));
  });

  it.each([
    { _type: 'page_home', slug: null, href: routes.home() },
    { _type: 'page_landing', slug: MOCK_ABOUT_SLUG, href: MOCK_ABOUT_HREF },
    { _type: 'page_post', slug: MOCK_POST_SLUG, href: MOCK_POST_HREF },
    { _type: 'page_postIndex', slug: null, href: routes.blogIndex() },
    {
      _type: 'page_topic',
      slug: MOCK_TOPIC_SLUG,
      href: routes.topic(MOCK_TOPIC_SLUG),
    },
    { _type: 'page_topicIndex', slug: null, href: routes.topics() },
    { _type: 'page_tag', slug: MOCK_TAG_SLUG, href: routes.tag(MOCK_TAG_SLUG) },
    { _type: 'page_tagIndex', slug: null, href: routes.tags() },
  ] as const)(
    'resolves an internal $_type reference to its route',
    ({ _type, slug, href }) => {
      const result = toLinkDocument(
        mockRawInternalLinkDocument({ internalReference: { _type, slug } }),
      );

      expect(result).toEqual(mockLinkView({ href }));
    },
  );

  it.each([
    { input: 'null', raw: null },
    { input: 'undefined', raw: undefined },
    {
      input: 'an external link with no url',
      raw: mockRawExternalLinkDocument({ url: null }),
    },
    {
      input: 'a page_post reference with no slug',
      raw: mockRawInternalLinkDocument({
        internalReference: { _type: 'page_post', slug: null },
      }),
    },
    {
      input: 'a page_landing reference with no slug',
      raw: mockRawInternalLinkDocument({
        internalReference: { _type: 'page_landing', slug: null },
      }),
    },
    {
      input: 'a dangling internal reference',
      raw: mockRawInternalLinkDocument({ internalReference: null }),
    },
    {
      input: 'a link with no label in any language',
      raw: mockRawInternalLinkDocument({ label: null }),
    },
  ])('returns undefined for $input', ({ raw }) => {
    const result = toLinkDocument(raw);

    expect(result).toBeUndefined();
  });
});
