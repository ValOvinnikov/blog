import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import { mockTenantSanityCredentials } from '@shinefold/db/testing/tenant-sanity-credentials/fixtures';
import {
  DOCUMENT_CAP_UNCOUNTED_TYPE_PREFIX,
  DOCUMENT_CAP_UNCOUNTED_TYPES,
  DOCUMENT_COUNT_MAX_RETRIES,
  DOCUMENT_COUNT_TIMEOUT_MS,
} from '@worker/constants/document-cap';
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
const MOCK_CREDENTIALS = mockTenantSanityCredentials({
  projectId: MOCK_SANITY_PROJECT_ID,
  dataset: MOCK_SANITY_DATASET,
  token: MOCK_SANITY_READ_TOKEN,
});

const { client, fetch } = mockSanityClient();

describe(countTenantDocuments, () => {
  beforeEach(() => {
    vi.mocked(createTenantSanityClient).mockReturnValue(client);
    fetch.mockResolvedValue(MOCK_DOCUMENT_COUNT);
  });

  it('counts drafts and versions on a short, once-retried read', async () => {
    await countTenantDocuments(MOCK_CREDENTIALS);

    expect(createTenantSanityClient).toHaveBeenCalledWith({
      projectId: MOCK_SANITY_PROJECT_ID,
      dataset: MOCK_SANITY_DATASET,
      token: MOCK_SANITY_READ_TOKEN,
      perspective: SANITY_PERSPECTIVE.RAW,
      timeoutMs: DOCUMENT_COUNT_TIMEOUT_MS,
      maxRetries: DOCUMENT_COUNT_MAX_RETRIES,
    });
  });

  it('leaves out the types the cap does not count', async () => {
    const count = await countTenantDocuments(MOCK_CREDENTIALS);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
      uncountedTypes: DOCUMENT_CAP_UNCOUNTED_TYPES,
      uncountedPrefix: DOCUMENT_CAP_UNCOUNTED_TYPE_PREFIX,
    });
    expect(count).toBe(MOCK_DOCUMENT_COUNT);
  });
});
