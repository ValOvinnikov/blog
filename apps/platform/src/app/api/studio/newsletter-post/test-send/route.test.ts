import { faker } from '@faker-js/faker';
import { resolveStudioCaller } from '@platform/server/auth/resolve-studio-caller';
import { sendNewsletterPostTest } from '@platform/server/newsletter-post-send/send-newsletter-post-test';
import {
  MOCK_STUDIO_CALLER,
  MOCK_STUDIO_PROJECT_ID,
  studioJsonRequest,
} from '@platform/testing/newsletter-post-send/fixtures';
import {
  ACTION_OUTCOME,
  HTTP_STATUS,
  LOCALE_ISO_CODES,
  NEWSLETTER_TEST_SEND_REFUSAL,
  routes,
} from '@shinefold/config';

import { POST } from './route';

vi.mock('@platform/utils/env/env');
vi.mock('@platform/server/auth/auth');
vi.mock('@shinefold/db', () => ({ queries: {} }));
vi.mock('@platform/server/auth/resolve-studio-caller');
vi.mock(
  '@platform/server/newsletter-post-send/send-newsletter-post-test',
  async (importOriginal) => ({
    ...(await importOriginal()),
    sendNewsletterPostTest: vi.fn(),
  }),
);

faker.seed(7714);

const PATH = routes.newsletterPostTestSend();
const BODY = {
  projectId: MOCK_STUDIO_PROJECT_ID,
  title: faker.lorem.sentence(),
  excerpt: faker.lorem.paragraph(),
  slug: faker.lorem.slug(),
  locale: LOCALE_ISO_CODES.EN,
};

describe(POST, () => {
  beforeEach(() => {
    vi.mocked(resolveStudioCaller).mockResolvedValue(MOCK_STUDIO_CALLER);
    vi.mocked(sendNewsletterPostTest).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });

  it('sends the saved fields to the caller', async () => {
    const response = await POST(studioJsonRequest(PATH, BODY));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(sendNewsletterPostTest).toHaveBeenCalledWith(MOCK_STUDIO_CALLER, {
      ...BODY,
      takeaways: [],
    });
  });

  it('refuses invalid fields without sending', async () => {
    const response = await POST(
      studioJsonRequest(PATH, { ...BODY, title: '' }),
    );

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(await response.json()).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_TEST_SEND_REFUSAL.INVALID_FIELDS,
    });
    expect(sendNewsletterPostTest).not.toHaveBeenCalled();
  });

  it('answers FORBIDDEN before reading the fields of a caller with no Studio', async () => {
    vi.mocked(resolveStudioCaller).mockResolvedValue(undefined);

    const response = await POST(
      studioJsonRequest(PATH, { ...BODY, title: '' }),
    );

    expect(response.status).toBe(HTTP_STATUS.FORBIDDEN);
    expect(sendNewsletterPostTest).not.toHaveBeenCalled();
  });

  it('answers a refused test with its retry time', async () => {
    const refusal = {
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_TEST_SEND_REFUSAL.RATE_LIMITED,
      retryAt: new Date().toISOString(),
    } as const;
    vi.mocked(sendNewsletterPostTest).mockResolvedValue(refusal);

    const response = await POST(studioJsonRequest(PATH, BODY));

    expect(response.status).toBe(HTTP_STATUS.TOO_MANY_REQUESTS);
    expect(await response.json()).toEqual(refusal);
  });

  it('answers SEND_FAILED when the send throws', async () => {
    vi.mocked(sendNewsletterPostTest).mockRejectedValue(new Error());

    const response = await POST(studioJsonRequest(PATH, BODY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(await response.json()).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: NEWSLETTER_TEST_SEND_REFUSAL.SEND_FAILED,
    });
  });
});
