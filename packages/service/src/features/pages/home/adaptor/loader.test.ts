import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_HOME_PAGE_ID,
  MOCK_POST_LATEST_MODULE_ID,
  mockCtaSlotView,
  mockHeroSlotView,
  mockRawCtaRef,
  mockRawHomePage,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_HOME_PAGE_CACHE_TAG,
  MOCK_TEMPLATE_HOME_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockRawSeo } from '@blog/service/testing/shared/fixtures';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getHomePageDocument } from './loader';
import { homePageQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6015101);

const tenant = mockTenant();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

async function loadHomePage(overrides?: Parameters<typeof mockRawHomePage>[0]) {
  mockRun.mockResolvedValueOnce(mockRawHomePage(overrides));
  const page = await getHomePageDocument(tenant);
  if (!page) throw new Error('expected a home page');
  return page;
}

describe(getHomePageDocument, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawHomePage());
  });

  it('maps the page_home document to its id, module refs and languages', async () => {
    const { id, hero, modules, translations } = await loadHomePage();

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

  it('rejects when page_home.hero resolves to a non-hero module type', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawHomePage({ hero: mockRawCtaRef() as never }),
    );

    await expect(getHomePageDocument(tenant)).rejects.toThrow();
  });

  it('leaves the seo description unset, with no fallback, when it is not authored', async () => {
    const { headingBlock } = mockRawHomePage();
    const { seo } = await loadHomePage({
      headingBlock: { ...headingBlock, supportingText: MOCK_SUPPORTING_TEXT },
      seo: mockRawSeo({ metaDescription: null }),
    });

    expect(seo.description).toBeUndefined();
  });

  it('lists the Home translations, a Home with no language as the default', async () => {
    const { translations } = await loadHomePage({
      translations: [{ language: null }, { language: LOCALE_ISO_CODES.NL }],
    });

    expect(translations).toEqual([LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL]);
  });

  it('resolves undefined when no page_home exists', async () => {
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
        tags: [MOCK_HOME_PAGE_CACHE_TAG, MOCK_TEMPLATE_HOME_CACHE_TAG],
      },
    });
  });
});
