import { STARTER_DOCUMENT_IDS } from '@shinefold/config';
import { HTTP_STATUS } from '@shinefold/config/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { SAMPLE_CONTENT_LOG } from '@worker/constants/sample-content';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  arrangeSignedWritableTenant,
  MOCK_SUSPENDED_WRITABLE_TENANT,
} from '@worker/testing/signed-tenant-request/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { removeSampleContent } from '@worker/units/remove-sample-content';
import { logger } from '@worker/utils/logger/logger';

import { POST } from './route';

const MOCK_REMOVE_URL = `${MOCK_WORKER_ORIGIN}/api/sample-content/remove`;
const MOCK_BODY = JSON.stringify({ tenantId: MOCK_TENANT_ID });
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

function removeRequest(): Request {
  return mockSignedRequest(MOCK_REMOVE_URL, MOCK_BODY, {
    secret: MOCK_ENQUEUE_SECRET,
  });
}

describe('POST /api/sample-content/remove', () => {
  beforeEach(() => {
    arrangeSignedWritableTenant();
    vi.mocked(removeSampleContent).mockResolvedValue(MOCK_REMOVAL_RESULT);
  });

  it('removes the samples and answers with what was removed and kept', async () => {
    const response = await POST(removeRequest());

    expect(response.status).toBe(HTTP_STATUS.OK);
    await expect(response.json()).resolves.toEqual(MOCK_REMOVAL_RESULT);
    expect(removeSampleContent).toHaveBeenCalledExactlyOnceWith(MOCK_TENANT_ID);
  });

  it('answers a conflict and removes nothing for a suspended tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(MOCK_SUSPENDED_WRITABLE_TENANT);

    const response = await POST(removeRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.NOT_WRITABLE,
    });
    expect(removeSampleContent).not.toHaveBeenCalled();
  });

  it('logs the removal failure when the removal throws', async () => {
    vi.mocked(removeSampleContent).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    await POST(removeRequest());

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      SAMPLE_CONTENT_LOG.REMOVAL_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_SANITY_OUTAGE },
    );
  });
});
