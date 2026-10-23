import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_HOME_PAGE_ID,
  MOCK_POST_LATEST_MODULE_ID,
  mockCtaSlotView,
  mockHeroSlotView,
  mockRawHomePage,
} from '@blog/service/testing/pages/fixtures';
import { MOCK_HOME_PAGE_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getHomePageDocument } from './loader';
import { homePageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(getHomePageDocument, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawHomePage());
  });

  it('maps the page_home document to its id, module refs and languages', async () => {
    const page = await getHomePageDocument(tenant);
    if (!page) throw new Error('expected a home page');
    const { id, hero, modules, translations } = page;

    expect({ id, hero, modules, translations }).toEqual({
      id: MOCK_HOME_PAGE_ID,
      hero: mockHeroSlotView(),
      modules: [
        { id: MOCK_POST_LATEST_MODULE_ID, type: 'module_postLatest' },
        mockCtaSlotView(),
      ],
      translations: [LOCALE_ISO_CODES.EN],
    });
  });

  it('resolves undefined, rather than rejecting, when no page_home exists', async () => {
    mockRun.mockResolvedValueOnce(null);

    const page = await getHomePageDocument(tenant);

    expect(page).toBeUndefined();
  });

  it('threads tenant context into the query and scopes its tags to it', async () => {
    await getHomePageDocument(tenant);

    expect(mockRun).toHaveBeenCalledWith(homePageQuery, {
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_HOME_PAGE_CACHE_TAG, 't:tenant-a:template_home'],
      },
    });
  });
});
