import { SCHEDULED_POST_PURGE_LOG } from '@worker/constants/scheduled-post-purge';
import { MOCK_WORKFLOW_CRASH } from '@worker/testing/outage/fixtures';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';

import { reportScheduledPostPurgeFailed } from './report-scheduled-post-purge-failed';

describe(reportScheduledPostPurgeFailed, () => {
  it('logs the failed run with its tenant and post', async () => {
    await reportScheduledPostPurgeFailed(
      MOCK_TENANT_ID,
      MOCK_POST_ID,
      MOCK_WORKFLOW_CRASH,
    );

    expect(logger.error).toHaveBeenCalledWith(
      SCHEDULED_POST_PURGE_LOG.RUN_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        error: MOCK_WORKFLOW_CRASH,
      },
    );
  });
});
