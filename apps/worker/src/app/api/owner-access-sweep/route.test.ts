import { OWNER_ACCESS_LOG } from '@worker/constants/owner-access';
import { cronRequest } from '@worker/testing/cron/fixtures';
import { MOCK_WORKER_ORIGIN } from '@worker/testing/enqueue/fixtures';
import { runCronSweep } from '@worker/utils/cron-request/cron-request';
import { runOwnerAccessSweep } from '@worker/utils/owner-access-sweep/run-owner-access-sweep';

import { GET } from './route';

vi.mock('@worker/utils/cron-request/cron-request');

describe('GET /api/owner-access-sweep', () => {
  it('runs the owner-access sweep as a cron sweep under its own events', async () => {
    const request = cronRequest(`${MOCK_WORKER_ORIGIN}/api/owner-access-sweep`);

    await GET(request);

    expect(runCronSweep).toHaveBeenCalledWith(
      request,
      {
        notConfigured: OWNER_ACCESS_LOG.SWEEP_NOT_CONFIGURED,
        failed: OWNER_ACCESS_LOG.SWEEP_FAILED,
      },
      runOwnerAccessSweep,
    );
  });
});
