import { faker } from '@faker-js/faker';
import {
  ACTION_OUTCOME,
  NEWSLETTER_SEND_NOW_REFUSAL,
  NEWSLETTER_SEND_STATUS_REFUSAL,
  routes,
} from '@shinefold/config';
import { mockNewsletterPostSendStatus } from '@shinefold/studio/testing/newsletter-post-send-status';

import {
  readNewsletterPostSendStatus,
  sendNewsletterPostNow,
} from './newsletter-post-send';

faker.seed(7711);

const MOCK_POST = {
  projectId: faker.string.alphanumeric(8),
  postId: faker.string.uuid(),
  isPublished: true,
};
const MOCK_STATUS = mockNewsletterPostSendStatus();
const SEND_FAILED = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: NEWSLETTER_SEND_NOW_REFUSAL.SEND_FAILED,
};

const fetchMock = vi.fn<typeof fetch>();

const respondWith = (body: unknown) => {
  fetchMock.mockResolvedValueOnce(Response.json(body));
};

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

describe(readNewsletterPostSendStatus, () => {
  it('reads the post’s status by project, post and publish state', async () => {
    respondWith(MOCK_STATUS);

    const status = await readNewsletterPostSendStatus(MOCK_POST);
    const [[url]] = fetchMock.mock.calls as [[string]];
    const { pathname, searchParams } = new URL(url, 'http://localhost');

    expect(status).toEqual(MOCK_STATUS);
    expect([pathname, Object.fromEntries(searchParams)]).toStrictEqual([
      routes.newsletterPostSendStatus(),
      { ...MOCK_POST, isPublished: String(MOCK_POST.isPublished) },
    ]);
  });

  it.each([
    [
      'a refusal',
      {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: NEWSLETTER_SEND_STATUS_REFUSAL.FORBIDDEN,
      },
    ],
    ['a failed read', null],
  ])('reads no status from %s', async (_label, body) => {
    respondWith(body);

    expect(await readNewsletterPostSendStatus(MOCK_POST)).toBeUndefined();
  });
});

describe(sendNewsletterPostNow, () => {
  it('reports a failed send when the platform cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError());

    expect(await sendNewsletterPostNow(MOCK_POST)).toStrictEqual(SEND_FAILED);
  });
});
