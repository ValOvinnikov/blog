import { MOCK_DOCUMENT_ID } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getReferencingModuleIds } from './loader';
import {
  linkIdsReferencingDocumentQuery,
  referencingModuleIdsQuery,
} from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6101);

const MOCK_LINK_IDS = [faker.string.uuid(), faker.string.uuid()];
const MOCK_MODULE_IDS = [faker.string.uuid(), faker.string.uuid()];
const UNCACHED = { revalidate: 0 };

const tenant = mockTenant();

describe(getReferencingModuleIds, () => {
  beforeEach(() => {
    mockRun.mockResolvedValue([]);
  });

  it('returns an empty list when nothing references the document', async () => {
    const result = await getReferencingModuleIds(MOCK_DOCUMENT_ID, tenant);

    expect(result).toEqual([]);
  });

  describe('when links reference the document', () => {
    beforeEach(() => {
      mockRun.mockResolvedValueOnce(MOCK_LINK_IDS);
    });

    it('returns every module id the lookup resolves', async () => {
      mockRun.mockResolvedValueOnce(MOCK_MODULE_IDS);

      const result = await getReferencingModuleIds(MOCK_DOCUMENT_ID, tenant);

      expect(result).toEqual(MOCK_MODULE_IDS);
    });

    it('looks up the links, then their modules, uncached for the tenant', async () => {
      await getReferencingModuleIds(MOCK_DOCUMENT_ID, tenant);

      expect(mockRun.mock.calls).toEqual([
        [
          linkIdsReferencingDocumentQuery,
          {
            parameters: { documentId: MOCK_DOCUMENT_ID },
            tenant,
            next: UNCACHED,
          },
        ],
        [
          referencingModuleIdsQuery,
          {
            parameters: {
              documentId: MOCK_DOCUMENT_ID,
              linkIds: MOCK_LINK_IDS,
            },
            tenant,
            next: UNCACHED,
          },
        ],
      ]);
    });
  });
});
