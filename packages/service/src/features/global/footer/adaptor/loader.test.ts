import {
  SANITY_CONTENT_REVALIDATE_SECONDS,
  type TMaybeNull,
} from '@blog/config';
import {
  FOOTER_FINE_PRINT_KIND,
  PORTABLE_TEXT_BLOCK_TYPE,
  SOCIAL_PLATFORMS,
} from '@blog/config/constants';
import {
  MOCK_LINKED_PAGE_CACHE_TAGS,
  mockRawFooter,
} from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockLinkView,
  mockRawExternalLinkDocument,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getFooter } from './loader';
import { footerQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6015107);

const MOCK_SOCIAL_LABEL = faker.lorem.word();
const MOCK_SOCIAL_URL = faker.internet.url();
const MOCK_TENANT = mockTenant();
const MOCK_HEADING = faker.lorem.word();
const MOCK_FIRST_URL = faker.internet.url();
const MOCK_SECOND_URL = faker.internet.url();
const MOCK_ABOUT = faker.lorem.sentence();
const MOCK_ADDRESS = faker.location.streetAddress({ useFullAddress: true });

const MOCK_UNRESOLVABLE_LINK = mockRawExternalLinkDocument({ url: null });

function mockRawLinkRef(url: TMaybeNull<string>) {
  return {
    _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
    link: url === null ? null : mockRawExternalLinkDocument({ url }),
  };
}

describe(getFooter, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawFooter());
  });

  it('throws when the footer document does not exist', async () => {
    mockRun.mockResolvedValueOnce(null);

    await expect(getFooter(MOCK_TENANT)).rejects.toThrow();
  });

  it('defaults social to an empty array when none are set', async () => {
    mockRun.mockResolvedValueOnce(mockRawFooter({ social: null }));

    const result = await getFooter(MOCK_TENANT);

    expect(result.social).toEqual([]);
  });

  it('maps raw social links into a domain object', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawFooter({
        social: [
          {
            platform: SOCIAL_PLATFORMS.GITHUB,
            link: mockRawExternalLinkDocument({
              label: MOCK_SOCIAL_LABEL,
              url: MOCK_SOCIAL_URL,
            }),
          },
        ],
      }),
    );

    const result = await getFooter(MOCK_TENANT);

    expect(result.social).toEqual([
      {
        platform: SOCIAL_PLATFORMS.GITHUB,
        link: mockLinkView({ label: MOCK_SOCIAL_LABEL, href: MOCK_SOCIAL_URL }),
      },
    ]);
  });

  it('maps groups in order with their headings and resolved links', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawFooter({
        groups: [
          {
            heading: MOCK_HEADING,
            links: [
              mockRawLinkRef(MOCK_FIRST_URL),
              mockRawLinkRef(MOCK_SECOND_URL),
            ],
          },
          { heading: null, links: [mockRawLinkRef(MOCK_SECOND_URL)] },
        ],
      }),
    );

    const result = await getFooter(MOCK_TENANT);

    expect(result.groups).toEqual([
      {
        heading: MOCK_HEADING,
        links: [
          mockLinkView({ href: MOCK_FIRST_URL }),
          mockLinkView({ href: MOCK_SECOND_URL }),
        ],
      },
      { heading: undefined, links: [mockLinkView({ href: MOCK_SECOND_URL })] },
    ]);
  });

  it('leaves out unresolvable links and drops a group left with none', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawFooter({
        groups: [
          {
            heading: MOCK_HEADING,
            links: [
              mockRawLinkRef(null),
              {
                ...mockRawLinkRef(MOCK_FIRST_URL),
                link: MOCK_UNRESOLVABLE_LINK,
              },
              mockRawLinkRef(MOCK_SECOND_URL),
            ],
          },
          { heading: MOCK_HEADING, links: [mockRawLinkRef(null)] },
          { heading: MOCK_HEADING, links: null },
        ],
      }),
    );

    const result = await getFooter(MOCK_TENANT);

    expect(result.groups).toEqual([
      {
        heading: MOCK_HEADING,
        links: [mockLinkView({ href: MOCK_SECOND_URL })],
      },
    ]);
  });

  it('maps fine-print items in order, leaving out unresolvable links', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawFooter({
        finePrint: [
          mockRawLinkRef(MOCK_FIRST_URL),
          mockRawLinkRef(null),
          { _type: 'cookieSettingsItem' },
          { ...mockRawLinkRef(MOCK_FIRST_URL), link: MOCK_UNRESOLVABLE_LINK },
          mockRawLinkRef(MOCK_SECOND_URL),
        ],
      }),
    );

    const result = await getFooter(MOCK_TENANT);

    expect(result.finePrint).toEqual([
      {
        kind: FOOTER_FINE_PRINT_KIND.LINK,
        link: mockLinkView({ href: MOCK_FIRST_URL }),
      },
      { kind: FOOTER_FINE_PRINT_KIND.COOKIE_SETTINGS },
      {
        kind: FOOTER_FINE_PRINT_KIND.LINK,
        link: mockLinkView({ href: MOCK_SECOND_URL }),
      },
    ]);
  });

  it('returns no groups, fine print, about text or address when none are set', async () => {
    const result = await getFooter(MOCK_TENANT);

    expect(result).toMatchObject({
      groups: [],
      finePrint: [],
      about: undefined,
      address: undefined,
    });
  });

  it('passes the about text and address through', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawFooter({ about: MOCK_ABOUT, address: MOCK_ADDRESS }),
    );

    const result = await getFooter(MOCK_TENANT);

    expect({ about: result.about, address: result.address }).toEqual({
      about: MOCK_ABOUT,
      address: MOCK_ADDRESS,
    });
  });

  it.each([
    ['undefined when unset', {}, undefined],
    ['through when set', { showLanguageSwitcher: true }, true],
  ])(
    'passes the language switcher toggle %s',
    async (_, overrides, expected) => {
      mockRun.mockResolvedValueOnce(mockRawFooter(overrides));

      const result = await getFooter(MOCK_TENANT);

      expect(result.showLanguageSwitcher).toBe(expected);
    },
  );

  it.each([
    ['shows the RSS feed when the switch was never set', {}, true],
    [
      'hides the RSS feed when the switch is off',
      { showRssFeed: false },
      false,
    ],
  ])('%s', async (_, overrides, expected) => {
    mockRun.mockResolvedValueOnce(mockRawFooter(overrides));

    const result = await getFooter(MOCK_TENANT);

    expect(result.showRssFeed).toBe(expected);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getFooter(MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(footerQuery, {
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [mockCacheTag('footer'), ...MOCK_LINKED_PAGE_CACHE_TAGS],
      },
    });
  });
});
