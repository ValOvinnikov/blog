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
import { mockTenant } from '@blog/service/testing/tenant';

import { getSectionPagesModuleDocument } from './loader';
import { sectionPagesModuleQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

const tenant = mockTenant();

describe(getSectionPagesModuleDocument, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue(mockRawSectionPagesModule());
  });

  it('resolves the module document fields', async () => {
    const module = await getSectionPagesModuleDocument(
      MOCK_SECTION_PAGES_MODULE_ID,
      tenant,
    );

    expect(module.headingBlock?.heading).toBe(MOCK_SECTION_PAGES_HEADING);
  });

  it('scopes the module cache tags to the tenant', async () => {
    await getSectionPagesModuleDocument(MOCK_SECTION_PAGES_MODULE_ID, tenant);

    expect(mockRun).toHaveBeenCalledWith(sectionPagesModuleQuery, {
      parameters: { id: MOCK_SECTION_PAGES_MODULE_ID },
      tenant,
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
      getSectionPagesModuleDocument(MOCK_MISSING_ID, tenant),
    ).rejects.toThrow();
  });
});
