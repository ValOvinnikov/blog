import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_SECTION_PAGES_HEADING,
  MOCK_SECTION_PAGES_MODULE_ID,
  mockRawSectionPagesModule,
} from '@blog/service/testing/modules/fixtures';
import { mockCacheTag } from '@blog/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@blog/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@blog/service/testing/tenant';

import { getSectionPagesModuleDocument } from './loader';
import { sectionPagesModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

describe(getSectionPagesModuleDocument, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawSectionPagesModule());
  });

  it('resolves the module document fields', async () => {
    const module = await getSectionPagesModuleDocument(
      MOCK_SECTION_PAGES_MODULE_ID,
      MOCK_TENANT,
    );

    expect(module.headingBlock?.heading).toBe(MOCK_SECTION_PAGES_HEADING);
  });

  it('queries the module by id for the tenant with its cache tags', async () => {
    await getSectionPagesModuleDocument(
      MOCK_SECTION_PAGES_MODULE_ID,
      MOCK_TENANT,
    );

    expect(mockRun).toHaveBeenCalledWith(sectionPagesModuleQuery, {
      parameters: { id: MOCK_SECTION_PAGES_MODULE_ID },
      tenant: MOCK_TENANT,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          mockCacheTag('modules:sectionPages'),
          mockCacheTag(`module:${MOCK_SECTION_PAGES_MODULE_ID}`),
        ],
      },
    });
  });

  it('propagates when the module document is missing', async () => {
    mockRun.mockRejectedValueOnce(mockValidationError());

    await expect(
      getSectionPagesModuleDocument(MOCK_MISSING_ID, MOCK_TENANT),
    ).rejects.toThrow();
  });
});
