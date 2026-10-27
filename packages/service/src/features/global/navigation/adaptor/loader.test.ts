import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import {
  BRAND_TAGLINE_SEPARATORS,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import {
  MOCK_LINKED_PAGE_CACHE_TAGS,
  mockRawNavigation,
} from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import {
  mockLinkView,
  mockRawExternalLinkDocument,
} from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getNavigation } from './loader';
import { navigationQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6015106);

const MOCK_LINK_LABEL = faker.lorem.word();
const MOCK_LINK_URL = faker.internet.url();
const MOCK_SUB_LINKS = Array.from({ length: 2 }, () => ({
  label: faker.lorem.word(),
  url: faker.internet.url(),
}));
const MOCK_TAGLINE_ITEMS = [faker.lorem.word(), faker.lorem.word()];
const MOCK_TENANT = mockTenant();

function mockRawLinkRef(label: string, url: string) {
  return {
    _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
    link: mockRawExternalLinkDocument({ label, url }),
  };
}

function mockRawLinkWithSubItems(
  subItems: { label: string; url: string }[],
  missingSubItemCount = 0,
) {
  return {
    ...mockRawLinkRef(MOCK_LINK_LABEL, MOCK_LINK_URL),
    _type: 'linkRefWithSubItems' as const,
    subItems: [
      ...Array.from({ length: missingSubItemCount }, () => ({ link: null })),
      ...subItems.map(({ label, url }) => ({
        link: mockRawExternalLinkDocument({ label, url }),
      })),
    ],
  };
}

describe(getNavigation, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawNavigation());
  });

  it('throws when the navigation document does not exist', async () => {
    mockRun.mockResolvedValueOnce(null);

    await expect(getNavigation(MOCK_TENANT)).rejects.toThrow();
  });

  it('defaults items to an empty array when none are set', async () => {
    mockRun.mockResolvedValueOnce(mockRawNavigation({ items: null }));

    const result = await getNavigation(MOCK_TENANT);

    expect(result.items).toEqual([]);
  });

  it('maps raw navigation items into a domain object', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawNavigation({
        items: [mockRawLinkRef(MOCK_LINK_LABEL, MOCK_LINK_URL)],
      }),
    );

    const result = await getNavigation(MOCK_TENANT);

    expect(result.items).toEqual([
      mockLinkView({ label: MOCK_LINK_LABEL, href: MOCK_LINK_URL }),
    ]);
  });

  it('lists a link with sub-items with its own page first, then its sub-items in order', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawNavigation({ items: [mockRawLinkWithSubItems(MOCK_SUB_LINKS)] }),
    );

    const result = await getNavigation(MOCK_TENANT);
    const ownLink = mockLinkView({
      label: MOCK_LINK_LABEL,
      href: MOCK_LINK_URL,
    });

    expect(result.items).toEqual([
      {
        ...ownLink,
        subItems: [
          ownLink,
          ...MOCK_SUB_LINKS.map(({ label, url }) =>
            mockLinkView({ label, href: url }),
          ),
        ],
      },
    ]);
  });

  it('drops only the sub-item whose link is missing', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawNavigation({
        items: [mockRawLinkWithSubItems(MOCK_SUB_LINKS.slice(1), 1)],
      }),
    );

    const result = await getNavigation(MOCK_TENANT);

    expect(result.items[0]?.subItems).toEqual([
      mockLinkView({ label: MOCK_LINK_LABEL, href: MOCK_LINK_URL }),
      ...MOCK_SUB_LINKS.slice(1).map(({ label, url }) =>
        mockLinkView({ label, href: url }),
      ),
    ]);
  });

  it('returns a plain link when none of its sub-items resolve', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawNavigation({ items: [mockRawLinkWithSubItems([], 1)] }),
    );

    const result = await getNavigation(MOCK_TENANT);

    expect(result.items).toEqual([
      mockLinkView({ label: MOCK_LINK_LABEL, href: MOCK_LINK_URL }),
    ]);
  });

  it('joins the tagline items with their separator', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawNavigation({
        tagline: {
          items: MOCK_TAGLINE_ITEMS.map((text) => ({
            _key: faker.string.uuid(),
            text,
          })),
          separator: BRAND_TAGLINE_SEPARATORS.PIPE,
        },
      }),
    );

    const result = await getNavigation(MOCK_TENANT);

    expect(result.tagline).toBe(MOCK_TAGLINE_ITEMS.join(' | '));
  });

  it('returns no tagline when none is set', async () => {
    const result = await getNavigation(MOCK_TENANT);

    expect(result.tagline).toBeUndefined();
  });

  it.each([
    ['undefined when unset', {}, undefined],
    ['through when set', { showLanguageSwitcher: true }, true],
  ])(
    'passes the language switcher toggle %s',
    async (_, overrides, expected) => {
      mockRun.mockResolvedValueOnce(mockRawNavigation(overrides));

      const result = await getNavigation(MOCK_TENANT);

      expect(result.showLanguageSwitcher).toBe(expected);
    },
  );

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getNavigation(MOCK_TENANT);

    expect(mockRun).toHaveBeenCalledWith(navigationQuery, {
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [mockCacheTag('navigation'), ...MOCK_LINKED_PAGE_CACHE_TAGS],
      },
    });
  });
});
