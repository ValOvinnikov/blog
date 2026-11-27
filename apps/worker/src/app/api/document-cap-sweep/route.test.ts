import { DOCUMENT_CAP_LOG } from '@worker/constants/document-cap';
import { cronRequest } from '@worker/testing/cron/fixtures';
import { MOCK_WORKER_ORIGIN } from '@worker/testing/enqueue/fixtures';
import { runCronSweep } from '@worker/utils/cron-request/cron-request';
import { runDocumentCapSweep } from '@worker/utils/document-cap-sweep/run-document-cap-sweep';

import { GET } from './route';

vi.mock('@worker/utils/cron-request/cron-request');

describe('GET /api/document-cap-sweep', () => {
  it('runs the document-cap sweep as a cron sweep under its own events', async () => {
    const request = cronRequest(`${MOCK_WORKER_ORIGIN}/api/document-cap-sweep`);

    await GET(request);

    expect(runCronSweep).toHaveBeenCalledWith(
      request,
      {
        notConfigured: DOCUMENT_CAP_LOG.SWEEP_NOT_CONFIGURED,
        failed: DOCUMENT_CAP_LOG.SWEEP_FAILED,
      },
      runDocumentCapSweep,
    );
  });
});
