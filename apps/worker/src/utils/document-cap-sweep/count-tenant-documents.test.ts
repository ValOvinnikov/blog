import {
  SANITY_PERSPECTIVE,
  LOCALE_ISO_CODES,
} from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import { DOCUMENT_CAP_UNCOUNTED_TYPES } from '@worker/constants/document-cap';
import { mockSanityClient } from '@worker/testing/sanity-client/mock-sanity-client';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_READ_TOKEN,
} from '@worker/testing/tenant/fixtures';
import { createTenantSanityClient } from '@worker/utils/tenant-sanity-client/tenant-sanity-client';

import { countTenantDocuments } from './count-tenant-documents';

vi.mock('@worker/utils/tenant-sanity-client/tenant-sanity-client');

const MOCK_DOCUMENT_COUNT = 4_210;
const MOCK_CREDENTIALS = {
  projectId: MOCK_SANITY_PROJECT_ID,
  dataset: MOCK_SANITY_DATASET,
  token: MOCK_SANITY_READ_TOKEN,
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  provisioningStatus: null,
  defaultLocale: LOCALE_ISO_CODES.EN,
};

const { client, fetch } = mockSanityClient();

describe(countTenantDocuments, () => {
  beforeEach(() => {
    vi.mocked(createTenantSanityClient).mockReturnValue(client);
    fetch.mockResolvedValue(MOCK_DOCUMENT_COUNT);
  });

  it('counts drafts and versions through the raw perspective', async () => {
    await countTenantDocuments(MOCK_CREDENTIALS);

    expect(createTenantSanityClient).toHaveBeenCalledWith({
      projectId: MOCK_SANITY_PROJECT_ID,
      dataset: MOCK_SANITY_DATASET,
      token: MOCK_SANITY_READ_TOKEN,
      perspective: SANITY_PERSPECTIVE.RAW,
    });
  });

  it('leaves the asset types the cap does not count out of the count', async () => {
    const count = await countTenantDocuments(MOCK_CREDENTIALS);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
      uncountedTypes: DOCUMENT_CAP_UNCOUNTED_TYPES,
    });
    expect(count).toBe(MOCK_DOCUMENT_COUNT);
  });
});
