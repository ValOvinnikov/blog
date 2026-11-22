import { STARTER_DOCUMENT_IDS } from '@shinefold/config';
import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { SAMPLE_CONTENT_LOG } from '@worker/constants/sample-content';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_ENCRYPTED_TOKEN,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { removeSampleContent } from '@worker/units/remove-sample-content';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';

import { POST } from './route';

const MOCK_REMOVE_URL = `${MOCK_WORKER_ORIGIN}/api/sample-content/remove`;
const MOCK_REMOVAL_RESULT = {
  removed: [STARTER_DOCUMENT_IDS.BLOG_CTA],
  keptEdited: [
    {
      id: STARTER_DOCUMENT_IDS.BLOG_ABOUT,
      type: 'page_landing',
      title: 'About',
    },
  ],
  keptReferenced: [
    { id: STARTER_DOCUMENT_IDS.BLOG_HERO, type: 'module_heroBlog' },
  ],
};

vi.mock('@worker/utils/env/env');
vi.mock('@worker/units/remove-sample-content');
vi.mock('@shinefold/db/queries/tenants');

function removeRequest(secret: string = MOCK_ENQUEUE_SECRET): Request {
  return mockSignedRequest(
    MOCK_REMOVE_URL,
    JSON.stringify({ tenantId: MOCK_TENANT_ID }),
    { secret },
  );
}

describe('POST /api/sample-content/remove', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(
      mockProvisionedTenant({
        sanityWriteTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
      }),
    );
    vi.mocked(removeSampleContent).mockResolvedValue(MOCK_REMOVAL_RESULT);
  });

  it('removes the samples and answers with what was removed and kept', async () => {
    const response = await POST(removeRequest());

    expect(response.status).toBe(HTTP_STATUS.OK);
    await expect(response.json()).resolves.toEqual(MOCK_REMOVAL_RESULT);
    expect(removeSampleContent).toHaveBeenCalledExactlyOnceWith(MOCK_TENANT_ID);
  });

  it.each([
    {
      name: 'an unsigned request',
      request: () =>
        new Request(MOCK_REMOVE_URL, {
          method: HTTP_METHOD.POST,
          body: JSON.stringify({ tenantId: MOCK_TENANT_ID }),
        }),
    },
    {
      name: 'a request signed with the wrong secret',
      request: () => removeRequest(MOCK_FORGED_SECRET),
    },
  ])('refuses $name', async ({ request }) => {
    const response = await POST(request());

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(removeSampleContent).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'not found for an unknown or archived tenant',
      tenant: undefined,
      status: HTTP_STATUS.NOT_FOUND,
      error: ENQUEUE_ERROR.NOT_FOUND,
    },
    {
      name: 'a conflict when the tenant has no Sanity write token yet',
      tenant: mockProvisionedTenant(),
      status: HTTP_STATUS.CONFLICT,
      error: ENQUEUE_ERROR.NOT_PROVISIONED,
    },
    {
      name: 'a conflict when the tenant is suspended',
      tenant: mockProvisionedTenant({
        status: TENANT_STATUS.SUSPENDED,
        sanityWriteTokenEncrypted: MOCK_ENCRYPTED_TOKEN,
      }),
      status: HTTP_STATUS.CONFLICT,
      error: ENQUEUE_ERROR.NOT_WRITABLE,
    },
  ])('answers $name', async ({ tenant, status, error }) => {
    vi.mocked(getTenantById).mockResolvedValue(tenant);

    const response = await POST(removeRequest());

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error });
    expect(removeSampleContent).not.toHaveBeenCalled();
  });

  it('logs and answers a server error when the removal fails', async () => {
    vi.mocked(removeSampleContent).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    const response = await POST(removeRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      SAMPLE_CONTENT_LOG.REMOVAL_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_SANITY_OUTAGE },
    );
  });
});
