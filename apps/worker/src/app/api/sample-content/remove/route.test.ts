import { STARTER_DOCUMENT_IDS } from '@shinefold/config';
import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config/constants';
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
  keptEdited: [STARTER_DOCUMENT_IDS.BLOG_ABOUT],
  keptReferenced: [STARTER_DOCUMENT_IDS.BLOG_HERO],
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

  it('refuses an unsigned request', async () => {
    const response = await POST(
      new Request(MOCK_REMOVE_URL, {
        method: HTTP_METHOD.POST,
        body: JSON.stringify({ tenantId: MOCK_TENANT_ID }),
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(removeSampleContent).not.toHaveBeenCalled();
  });

  it('refuses a request signed with the wrong secret', async () => {
    const response = await POST(removeRequest(MOCK_FORGED_SECRET));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(removeSampleContent).not.toHaveBeenCalled();
  });

  it('answers not found for an unknown or archived tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    const response = await POST(removeRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.NOT_FOUND,
    });
    expect(removeSampleContent).not.toHaveBeenCalled();
  });

  it('answers a conflict when the tenant has no Sanity write token yet', async () => {
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());

    const response = await POST(removeRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.NOT_PROVISIONED,
    });
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
