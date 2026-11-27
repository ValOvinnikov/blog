import { faker } from '@faker-js/faker';
import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_SECTION_PAGES_PARENT_ID,
  MOCK_SECTION_PAGES_PARENT_PATH,
  mockRawSectionPage,
} from '@shinefold/service/testing/modules/section-pages/fixtures';
import { MOCK_PAGE_LANDING_CACHE_TAG } from '@shinefold/service/testing/sanity/query/cache-tags';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getSectionPages } from './loader';
import { sectionPagesQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

faker.seed(31);

const MOCK_CHILD_SLUG = faker.lorem.slug();

describe(getSectionPages, () => {
  it('paths the hosting page children beneath the hosting page path', async () => {
    mockRun.mockResolvedValueOnce([
      mockRawSectionPage({ slug: MOCK_CHILD_SLUG }),
    ]);

    const pages = await getSectionPages(
      MOCK_SECTION_PAGES_PARENT_ID,
      MOCK_SECTION_PAGES_PARENT_PATH,
      MOCK_TENANT,
    );

    expect(pages.map((page) => page.path)).toEqual([
      `${MOCK_SECTION_PAGES_PARENT_PATH}/${MOCK_CHILD_SLUG}`,
    ]);
  });

  it('queries the children of the hosting page for the tenant', async () => {
    mockRun.mockResolvedValueOnce([]);

    await getSectionPages(
      MOCK_SECTION_PAGES_PARENT_ID,
      MOCK_SECTION_PAGES_PARENT_PATH,
      MOCK_TENANT,
    );

    expect(mockRun).toHaveBeenCalledWith(sectionPagesQuery, {
      parameters: { parentId: MOCK_SECTION_PAGES_PARENT_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [MOCK_PAGE_LANDING_CACHE_TAG],
      },
    });
  });
});
