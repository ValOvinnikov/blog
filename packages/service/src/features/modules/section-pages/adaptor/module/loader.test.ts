import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@shinefold/config';
import { mockRun } from '@shinefold/service/testing/mock-run-query';
import {
  MOCK_SECTION_PAGES_HEADING,
  MOCK_SECTION_PAGES_MODULE_ID,
  mockRawSectionPagesModule,
} from '@shinefold/service/testing/modules/fixtures';
import { mockCacheTag } from '@shinefold/service/testing/sanity/query/cache-tags';
import {
  MOCK_MISSING_ID,
  mockValidationError,
} from '@shinefold/service/testing/shared/fixtures';
import { MOCK_TENANT } from '@shinefold/service/testing/tenant';

import { getSectionPagesModuleDocument } from './loader';
import { sectionPagesModuleQuery } from './query';

vi.mock('@shinefold/service/sanity/query/query');

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
