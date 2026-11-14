import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import {
  MOCK_ENQUEUE_SECRET,
  MOCK_FORGED_SECRET,
  MOCK_NEWSLETTER_ENQUEUE_SECRET,
  MOCK_WORKER_ORIGIN,
} from '@worker/testing/enqueue/fixtures';
import { mockSignedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { MOCK_QUEUE_DOWN } from '@worker/testing/outage/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_RUN_ID } from '@worker/testing/run/fixtures';
import { MOCK_PUBLISHED_AT } from '@worker/testing/scheduled-post-purge/fixtures';
import {
  MOCK_ENCRYPTED_TOKEN,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
} from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { logger } from '@worker/utils/logger/logger';
import { purgeScheduledPost } from '@worker/workflows/purge-scheduled-post';
import { start } from 'workflow/api';

import { POST } from './route';

const MOCK_PURGE_URL = `${MOCK_WORKER_ORIGIN}/api/scheduled-post-purge`;
const MOCK_BODY = {
  tenantId: MOCK_TENANT_ID,
  postId: MOCK_POST_ID,
  publishedAt: MOCK_PUBLISHED_AT,
};

vi.mock('@worker/utils/env/env');
vi.mock('@worker/workflows/purge-scheduled-post');
vi.mock('workflow/api');
vi.mock('@blog/db/queries/tenants');

function purgeRequest(
  body: Record<string, unknown> = MOCK_BODY,
  secret: string = MOCK_NEWSLETTER_ENQUEUE_SECRET,
): Request {
  return mockSignedRequest(MOCK_PURGE_URL, JSON.stringify(body), { secret });
}

describe('POST /api/scheduled-post-purge', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = MOCK_ENQUEUE_SECRET;
    mockEnv.WORKER_NEWSLETTER_ENQUEUE_SECRET = MOCK_NEWSLETTER_ENQUEUE_SECRET;
    vi.mocked(getTenantById).mockResolvedValue(
      mockProvisionedTenant({ sanityReadTokenEncrypted: MOCK_ENCRYPTED_TOKEN }),
    );
    vi.mocked(start).mockResolvedValue({ runId: MOCK_RUN_ID } as never);
  });

  it('starts the purge run for the scheduled post and answers with its id', async () => {
    const response = await POST(purgeRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    await expect(response.json()).resolves.toEqual({ runId: MOCK_RUN_ID });
    expect(start).toHaveBeenCalledWith(purgeScheduledPost, [
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_PUBLISHED_AT,
    ]);
  });

  it('starts one run per instant, however the publish time is spelled', async () => {
    const offsetSpelling = MOCK_PUBLISHED_AT.replace('Z', '+00:00');

    await POST(purgeRequest({ ...MOCK_BODY, publishedAt: offsetSpelling }));

    expect(start).toHaveBeenCalledWith(purgeScheduledPost, [
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_PUBLISHED_AT,
    ]);
  });

  it('refuses an unsigned request', async () => {
    const response = await POST(
      new Request(MOCK_PURGE_URL, {
        method: HTTP_METHOD.POST,
        body: JSON.stringify(MOCK_BODY),
      }),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it.each([
    ['a forged secret', MOCK_FORGED_SECRET],
    ["the provisioning routes' enqueue secret", MOCK_ENQUEUE_SECRET],
  ])('refuses a request signed with %s', async (_label, secret) => {
    const response = await POST(purgeRequest(undefined, secret));

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(start).not.toHaveBeenCalled();
  });

  it.each([
    { tenantId: MOCK_TENANT_ID, publishedAt: MOCK_PUBLISHED_AT },
    { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID },
    { ...MOCK_BODY, publishedAt: 'tomorrow' },
    { ...MOCK_BODY, publishedAt: new Date(0).toISOString() },
  ])('refuses a malformed body %j', async (body) => {
    const response = await POST(purgeRequest(body));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers not found for an unknown or archived tenant', async () => {
    vi.mocked(getTenantById).mockResolvedValue(undefined);

    const response = await POST(purgeRequest());

    expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    expect(start).not.toHaveBeenCalled();
  });

  it('answers a conflict when the tenant cannot read its Sanity content yet', async () => {
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());

    const response = await POST(purgeRequest());

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    await expect(response.json()).resolves.toEqual({
      error: ENQUEUE_ERROR.NOT_PROVISIONED,
    });
  });

  it('logs and answers a server error when the run cannot be started', async () => {
    vi.mocked(start).mockRejectedValue(new Error(MOCK_QUEUE_DOWN));

    const response = await POST(purgeRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      SCHEDULED_POST_PURGE_LOG.START_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        error: MOCK_QUEUE_DOWN,
      },
    );
  });
});
