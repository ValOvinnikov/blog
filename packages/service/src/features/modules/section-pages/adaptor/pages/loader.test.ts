import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_SECTION_PAGES_PARENT_ID,
  mockRawSectionPage,
} from '@blog/service/testing/modules/fixtures';
import { MOCK_PAGE_LANDING_CACHE_TAG } from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';

import { getSectionPages } from './loader';
import { sectionPagesQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(getSectionPages, () => {
  it('queries the hosting page children and paths them beneath it', async () => {
    mockRun.mockResolvedValueOnce([mockRawSectionPage()]);

    const pages = await getSectionPages(
      MOCK_SECTION_PAGES_PARENT_ID,
      'modules',
      tenant,
    );

    expect(pages.map((page) => page.path)).toEqual(['modules/faq']);
    expect(mockRun).toHaveBeenCalledWith(sectionPagesQuery, {
      parameters: { parentId: MOCK_SECTION_PAGES_PARENT_ID },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_LANDING_CACHE_TAG],
      },
    });
  });
});
