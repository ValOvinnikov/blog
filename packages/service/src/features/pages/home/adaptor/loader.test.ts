import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  makeRawHomePage,
  RAW_HOME_PAGE_ID,
} from '@blog/service/testing/pages/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { getHomePageDocument } from './loader';
import { homePageQuery } from './query';

vi.mock(import('@blog/service/sanity/query/query'), async (importOriginal) => ({
  ...(await importOriginal()),
  runQuery: vi.fn(),
}));

const tenant = makeTenant();

describe('getHomePageDocument', () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(makeRawHomePage());
  });

  it('maps the page_home document to its id, module refs and languages', async () => {
    const page = await getHomePageDocument(tenant);
    if (!page) throw new Error('expected a home page');
    const { id, hero, modules, translations } = page;

    expect({ id, hero, modules, translations }).toEqual({
      id: RAW_HOME_PAGE_ID,
      hero: { id: 'hero-1', type: 'module_heroBlog' },
      modules: [
        { id: 'post-latest-1', type: 'module_postLatest' },
        { id: 'cta-1', type: 'module_cta' },
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
        tags: ['t:tenant-a:homePage', 't:tenant-a:template_home'],
      },
    });
  });
});
