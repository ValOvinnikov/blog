import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { enqueueWorkerRun } from '@web/server/revalidate/enqueue-worker-run/enqueue-worker-run';

const NEWSLETTER_POST_SEND_PATH = '/api/newsletter/post-send';

export type TNewsletterPostSendRequest = {
  tenantId: string;
  postId: string;
  claimedAt: string;
};

export const enqueueNewsletterPostSend = (
  request: TNewsletterPostSendRequest,
): Promise<boolean> =>
  enqueueWorkerRun({
    path: NEWSLETTER_POST_SEND_PATH,
    request,
    log: {
      SKIPPED: REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_SKIPPED,
      REFUSED: REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_REFUSED,
      FAILED: REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_FAILED,
    },
  });
