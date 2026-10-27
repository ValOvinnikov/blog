import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
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
const MOCK_TENANT = mockTenant();

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
        items: [
          {
            link: mockRawExternalLinkDocument({
              label: MOCK_LINK_LABEL,
              url: MOCK_LINK_URL,
            }),
          },
        ],
      }),
    );

    const result = await getNavigation(MOCK_TENANT);

    expect(result.items).toEqual([
      mockLinkView({ label: MOCK_LINK_LABEL, href: MOCK_LINK_URL }),
    ]);
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
