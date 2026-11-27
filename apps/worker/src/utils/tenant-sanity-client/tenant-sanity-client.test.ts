import { createClient } from '@sanity/client';
import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import { SANITY_API_TIMEOUT_MS } from '@shinefold/db/utils/sanity-management-client/sanity-api-request';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_READ_TOKEN,
} from '@worker/testing/tenant/fixtures';

import { createTenantSanityClient } from './tenant-sanity-client';

vi.mock('@sanity/client');

const MOCK_TIMEOUT_MS = 5_000;
const MOCK_MAX_RETRIES = 2;

const MOCK_OPTIONS = {
  projectId: MOCK_SANITY_PROJECT_ID,
  dataset: MOCK_SANITY_DATASET,
  token: MOCK_SANITY_READ_TOKEN,
};

describe(createTenantSanityClient, () => {
  it('builds an uncached client with the default timeout, retries and perspective', () => {
    createTenantSanityClient(MOCK_OPTIONS);

    const [clientOptions] = vi.mocked(createClient).mock.lastCall ?? [];
    expect(clientOptions).toMatchObject({
      ...MOCK_OPTIONS,
      useCdn: false,
      timeout: SANITY_API_TIMEOUT_MS,
    });
    expect(clientOptions).not.toHaveProperty('perspective');
    expect(clientOptions).not.toHaveProperty('maxRetries');
  });

  it('applies a given timeout and retry count', () => {
    createTenantSanityClient({
      ...MOCK_OPTIONS,
      timeoutMs: MOCK_TIMEOUT_MS,
      maxRetries: MOCK_MAX_RETRIES,
    });

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: MOCK_TIMEOUT_MS,
        maxRetries: MOCK_MAX_RETRIES,
      }),
    );
  });

  it('reads through the given perspective', () => {
    createTenantSanityClient({
      ...MOCK_OPTIONS,
      perspective: SANITY_PERSPECTIVE.PUBLISHED,
    });

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({ perspective: SANITY_PERSPECTIVE.PUBLISHED }),
    );
  });
});
