import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { NEWSLETTER_SEND_LOG } from '@worker/constants/newsletter-send';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import {
  MOCK_CLAIMED_AT,
  MOCK_POST_ID,
} from '@worker/testing/newsletter-send/fixtures';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import {
  MOCK_ENCRYPTED_TOKEN,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { sendNewsletterPost } from '@worker/workflows/send-newsletter-post';
import { start } from 'workflow/api';

import { POST } from './route';

const MOCK_POST_SEND_URL = `${MOCK_WORKER_ORIGIN}/api/newsletter/post-send`;
const MOCK_BODY = {
  tenantId: MOCK_TENANT_ID,
  postId: MOCK_POST_ID,
  claimedAt: MOCK_CLAIMED_AT,
};

vi.mock('@worker/utils/env/env');
vi.mock('@worker/workflows/send-newsletter-post');
vi.mock('workflow/api');
vi.mock('@blog/db/queries/tenants');

function postSendRequest(
  body: Record<string, unknown> = MOCK_BODY,
  secret: string = MOCK_ENQUEUE_SECRET,
): Request {
  return mockSignedRequest(MOCK_POST_SEND_URL, JSON.stringify(body), {
    secret,
  });
}

describe('POST /api/newsletter/post-send', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(
      mockProvisionedTenant({ sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN }),
    );
    vi.mocked(start).mockResolvedValue({ runId: MOCK_RUN_ID } as never);
  });

  it('starts the send run for the claimed post and answers with its id', async () => {
    const response = await POST(postSendRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    await expect(response.json()).resolves.toEqual({ runId: MOCK_RUN_ID });
    expect(start).toHaveBeenCalledWith(sendNewsletterPost, [
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_CLAIMED_AT,
    ]);
  });

  it('refuses an unsigned request', async () => {
    const response = await POST(
      new Request(MOCK_POST_SEND_URL, {
        method: HTTP_METHOD.POST,
        body: JSON.stringify(MOCK_BODY),
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it('refuses a request signed with the wrong secret', async () => {
    const response = await POST(postSendRequest(undefined, MOCK_FORGED_SECRET));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it.each([
    { tenantId: MOCK_TENANT_ID, claimedAt: MOCK_CLAIMED_AT },
    { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID },
    { ...MOCK_BODY, claimedAt: 'yesterday' },
  ])('refuses a malformed body %j', async (body) => {
    const response = await POST(postSendRequest(body));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers not found for an unknown or archived tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    const response = await POST(postSendRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers a conflict when the tenant cannot read its Sanity content yet', async () => {
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());

    const response = await POST(postSendRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.NOT_PROVISIONED,
    });
  });

  it('logs and answers a server error when the run cannot be started', async () => {
    vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await POST(postSendRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      NEWSLETTER_SEND_LOG.START_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        error: MOCK_QUEUE_DOWN,
      },
    );
  });
});
