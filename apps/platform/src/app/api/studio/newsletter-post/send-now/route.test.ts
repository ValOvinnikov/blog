import { resolveStudioCaller } from '@platform/server/auth/resolve-studio-caller';
import { startNewsletterPostSendNow } from '@platform/server/newsletter-post-send/start-newsletter-post-send-now';
import { itRefusesCrossSiteStudioRequests } from '@platform/testing/newsletter-post-send/cross-site-refusal';
import {
  MOCK_STUDIO_CALLER,
  MOCK_STUDIO_PROJECT_ID,
  studioJsonRequest,
} from '@platform/testing/newsletter-post-send/fixtures';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEWSLETTER_SEND_NOW_REFUSAL,
  routes,
} from '@shinefold/config';
import { MOCK_POST_ID } from '@shinefold/db/testing/newsletter-post-sends/fixtures';

import { POST } from './route';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/server/auth/auth');
vi.mock('@shinefold/db', () => ({ queries: {} }));
vi.mock('@platform/server/auth/resolve-studio-caller');
vi.mock('@platform/server/newsletter-post-send/start-newsletter-post-send-now');

const PATH = routes.newsletterPostSendNow();
const MOCK_BODY = {
  projectId: MOCK_STUDIO_PROJECT_ID,
  postId: MOCK_POST_ID,
  isPublished: true,
};

describe(POST, () => {
  beforeEach(() => {
    vi.mocked(resolveStudioCaller).mockResolvedValue(MOCK_STUDIO_CALLER);
    vi.mocked(startNewsletterPostSendNow).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });

  it("starts the post's send for the caller's site", async () => {
    const response = await POST(studioJsonRequest(PATH, MOCK_BODY));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(await response.json()).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(startNewsletterPostSendNow).toHaveBeenCalledWith(
      MOCK_STUDIO_CALLER.tenant,
      { postId: MOCK_POST_ID, isPublished: true },
    );
  });

  it('answers a refusal with its code', async () => {
    const refusal = {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_SEND_NOW_REFUSAL.ALREADY_SENT,
    } as const;
    vi.mocked(startNewsletterPostSendNow).mockResolvedValue(refusal);

    const response = await POST(studioJsonRequest(PATH, MOCK_BODY));

    expect(response.status).toBe(HTTP_STATUS.CONFLICT);
    expect(await response.json()).toEqual(refusal);
  });

  it('answers FORBIDDEN, starting nothing, for a caller who cannot open the Studio', async () => {
    vi.mocked(resolveStudioCaller).mockResolvedValue(undefined);

    const response = await POST(studioJsonRequest(PATH, MOCK_BODY));

    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(startNewsletterPostSendNow).not.toHaveBeenCalled();
  });

  it('answers SEND_FAILED when starting the send throws', async () => {
    vi.mocked(startNewsletterPostSendNow).mockRejectedValue(new Error());

    const response = await POST(studioJsonRequest(PATH, MOCK_BODY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED,
    });
  });

  itRefusesCrossSiteStudioRequests(
    POST,
    PATH,
    MOCK_BODY,
    vi.mocked(startNewsletterPostSendNow),
  );
});
