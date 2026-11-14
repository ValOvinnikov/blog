import { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { reportRunFailed } from './report-run-failed';

describe(reportRunFailed, () => {
  it('logs the failed run under its event, with its tenant and post', async () => {
    await reportRunFailed(
      SCHEDULED_POST_PURGE_LOG.RUN_FAILED,
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_WORKFLOW_CRASH,
    );

    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      SCHEDULED_POST_PURGE_LOG.RUN_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        error: MOCK_WORKFLOW_CRASH,
      },
    );
  });
});
