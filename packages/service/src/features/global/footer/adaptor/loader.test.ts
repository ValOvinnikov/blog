import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { SOCIAL_PLATFORMS } from '@blog/config/constants';
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

import { getFooter } from './loader';
import { footerQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const GITHUB_URL = 'https://github.com/val';

const tenant = mockTenant();

describe(getFooter, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawFooter());
  });

  it('throws when the footer document does not exist', async () => {
    mockRun.mockResolvedValueOnce(null);

    await expect(getFooter(tenant)).rejects.toThrow();
  });

  it('defaults social to an empty array when none are set', async () => {
    mockRun.mockResolvedValueOnce(mockRawFooter({ social: null }));

    const result = await getFooter(tenant);

    expect(result.social).toEqual([]);
  });

  it('maps raw social links into a domain object', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawFooter({
        social: [
          {
            platform: SOCIAL_PLATFORMS.GITHUB,
            link: mockRawExternalLinkDocument({
              label: 'GitHub',
              url: GITHUB_URL,
            }),
          },
        ],
      }),
    );

    const result = await getFooter(tenant);

    expect(result.social).toEqual([
      {
        platform: SOCIAL_PLATFORMS.GITHUB,
        link: mockLinkView({ label: 'GitHub', href: GITHUB_URL }),
      },
    ]);
  });

  it.each([
    ['undefined when unset', {}, undefined],
    ['through when set', { showLanguageSwitcher: true }, true],
  ])(
    'passes the language switcher toggle %s',
    async (_, overrides, expected) => {
      mockRun.mockResolvedValueOnce(mockRawFooter(overrides));

      const result = await getFooter(tenant);

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

    const result = await getFooter(tenant);

    expect(result.showRssFeed).toBe(expected);
  });

  it('threads tenant context into runQuery and scopes the tags to it', async () => {
    await getFooter(tenant);

    expect(mockRun).toHaveBeenCalledWith(footerQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [mockCacheTag('footer'), ...MOCK_LINKED_PAGE_CACHE_TAGS],
      },
    });
  });
});
