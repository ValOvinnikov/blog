import { MOCK_DOCUMENT_ID } from '@blog/service/testing/entities/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';
import { mockTenant } from '@blog/service/testing/tenant';

import { getReferencingModuleIds } from './loader';
import {
  linkIdsReferencingDocumentQuery,
  referencingModuleIdsQuery,
} from './query';

vi.mock('@blog/service/sanity/query/query');

const LINK_IDS = ['link-a', 'link-b'];
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
      mockRun.mockResolvedValueOnce(LINK_IDS);
    });

    it('returns every module id the lookup resolves', async () => {
      mockRun.mockResolvedValueOnce(['module-a', 'module-b']);

      const result = await getReferencingModuleIds(MOCK_DOCUMENT_ID, tenant);

      expect(result).toEqual(['module-a', 'module-b']);
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
            parameters: { documentId: MOCK_DOCUMENT_ID, linkIds: LINK_IDS },
            tenant,
            next: UNCACHED,
          },
        ],
      ]);
    });
  });
});
