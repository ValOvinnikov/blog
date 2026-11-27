import { DOCUMENT_CAP_LOG } from '@worker/constants/document-cap';
import { runCronSweep } from '@worker/utils/cron-request/cron-request';
import { runDocumentCapSweep } from '@worker/utils/document-cap-sweep/run-document-cap-sweep';

// Next requires a literal here, so it cannot import a const.
export const maxDuration = 300;

export async function GET(request: Request): Promise<Response> {
  return runCronSweep(
    request,
    {
      notConfigured: DOCUMENT_CAP_LOG.SWEEP_NOT_CONFIGURED,
      failed: DOCUMENT_CAP_LOG.SWEEP_FAILED,
    },
    runDocumentCapSweep,
  );
}
