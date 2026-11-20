import { STUDIO_NEWSLETTER_LOG } from '@platform/constants/studio-newsletter';
import { resolveStudioCaller } from '@platform/server/auth/resolve-studio-caller';
import { readNewsletterPostSend } from '@platform/server/newsletter-post-send/read-newsletter-post-send';
import {
  MOCK_STUDIO_CALLER,
  MOCK_STUDIO_PROJECT_ID,
} from '@platform/testing/newsletter-post-send/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  NEWSLETTER_SEND_NOW_REFUSAL,
  NEWSLETTER_SEND_STATUS,
  NEWSLETTER_SKIP_REASON,
  routes,
} from '@shinefold/config';
import { MOCK_POST_ID } from '@shinefold/db/testing/newsletter-post-sends/fixtures';

import { GET } from './route';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/server/auth/auth');
vi.mock('@shinefold/db', () => ({ queries: {} }));
vi.mock('@platform/server/auth/resolve-studio-caller');
vi.mock('@platform/server/newsletter-post-send/read-newsletter-post-send');

const MOCK_CONFIRMED_COUNT = 9;

const statusRequest = (query: Record<string, string>) =>
  new Request(
    `https://platform.example${routes.newsletterPostSendStatus()}?${new URLSearchParams(query).toString()}`,
  );

const POST_QUERY = {
  projectId: MOCK_STUDIO_PROJECT_ID,
  postId: MOCK_POST_ID,
  isPublished: 'true',
};

describe(GET, () => {
  beforeEach(() => {
    vi.mocked(resolveStudioCaller).mockResolvedValue(MOCK_STUDIO_CALLER);
    vi.mocked(readNewsletterPostSend).mockResolvedValue({
      claim: undefined,
      sendingOffCause: NEWSLETTER_SKIP_REASON.SENDING_OFF,
      confirmedCount: MOCK_CONFIRMED_COUNT,
      bandCeiling: undefined,
      sendNow: {
        isOffered: true,
        disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.SENDING_OFF,
      },
    });
  });

  it('answers the state, count, off cause and Send emails eligibility', async () => {
    const response = await GET(statusRequest(POST_QUERY));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(await response.json()).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
      status: NEWSLETTER_SEND_STATUS.NONE,
      confirmedCount: MOCK_CONFIRMED_COUNT,
      sendingOffCause: NEWSLETTER_SKIP_REASON.SENDING_OFF,
      sendNow: {
        isOffered: true,
        disabledBy: NEWSLETTER_SEND_NOW_REFUSAL.SENDING_OFF,
      },
    });
    expect(resolveStudioCaller).toHaveBeenCalledWith(MOCK_STUDIO_PROJECT_ID);
    expect(readNewsletterPostSend).toHaveBeenCalledWith(
      MOCK_STUDIO_CALLER.tenant,
      { postId: MOCK_POST_ID, isPublished: true },
    );
  });

  it('answers FORBIDDEN, reading nothing, for a caller who cannot open the Studio', async () => {
    vi.mocked(resolveStudioCaller).mockResolvedValue(undefined);

    const response = await GET(statusRequest(POST_QUERY));

    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(await response.json()).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_SEND_NOW_REFUSAL.FORBIDDEN,
    });
    expect(readNewsletterPostSend).not.toHaveBeenCalled();
  });

  it('refuses a request with no post', async () => {
    const response = await GET(statusRequest({ ...POST_QUERY, postId: '' }));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(resolveStudioCaller).not.toHaveBeenCalled();
  });

  it('logs and fails a read that throws', async () => {
    vi.mocked(readNewsletterPostSend).mockRejectedValue(new Error());

    const response = await GET(statusRequest(POST_QUERY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(logger.error).toHaveBeenCalledWith(
      STUDIO_NEWSLETTER_LOG.STATUS_FAILED,
      expect.objectContaining({
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
      }),
    );
  });
});
