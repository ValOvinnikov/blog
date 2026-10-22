import type { TMaybeUndefined } from '@blog/config';
import { HTTP_STATUS } from '@blog/config/constants';
import { getTenantById } from '@blog/db/queries/tenants';
import { signedRequest } from '@worker/testing/enqueue/sign-enqueue-request';
import { SANITY_PROJECT_ID } from '@worker/testing/owner-access/fixtures';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { resendOwnerInvite } from '@worker/units/resend-owner-invite';
import { wakeOwnerAccess } from '@worker/utils/owner-access-run/owner-access-run';

import { POST } from './route';

const SECRET = 'enqueue-secret';
const RESEND_URL = 'https://worker.example.com/api/owner-access/resend';

const mockEnv = vi.hoisted((): Record<string, TMaybeUndefined<string>> => ({}));

vi.mock('@worker/utils/env/env', () => ({ env: mockEnv }));
vi.mock('@worker/units/resend-owner-invite');
vi.mock('@worker/utils/owner-access-run/owner-access-run');
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);

function resendRequest(): Request {
  return signedRequest(
    RESEND_URL,
    JSON.stringify({ tenantId: TEST_TENANT_ID }),
    { secret: SECRET },
  );
}

describe('POST /api/owner-access/resend', () => {
  beforeEach(() => {
    mockEnv.WORKER_ENQUEUE_SECRET = SECRET;
    vi.mocked(getTenantById).mockResolvedValue(
      makeTenant({ sanityProjectId: SANITY_PROJECT_ID }),
    );
  });

  it('resends the invite, then restarts the checks', async () => {
    const order: string[] = [];
    vi.mocked(resendOwnerInvite).mockImplementation(async () => {
      order.push('resend');
    });
    vi.mocked(wakeOwnerAccess).mockImplementation(async () => {
      order.push('wake');
    });

    const response = await POST(resendRequest());

    expect(response.status).toBe(HTTP_STATUS.ACCEPTED);
    expect(resendOwnerInvite).toHaveBeenCalledWith(TEST_TENANT_ID);
    expect(order).toEqual(['resend', 'wake']);
  });

  it('answers 500 and restarts nothing when the resend fails', async () => {
    vi.mocked(resendOwnerInvite).mockRejectedValue(new Error('403'));

    const response = await POST(resendRequest());

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(wakeOwnerAccess).not.toHaveBeenCalled();
  });
});
