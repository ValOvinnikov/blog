import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
} from '@blog/utils/enqueue-signature';
import { faker } from '@faker-js/faker';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  enqueueNewsletterPostSend,
  NEWSLETTER_POST_SEND_PATH,
} from './enqueue-newsletter-post-send';

const { envMock } = vi.hoisted(() => ({
  envMock: {} as {
    WORKER_ENQUEUE_URL?: string;
    WORKER_ENQUEUE_SECRET?: string;
  },
}));

vi.mock('@web/utils/env/env', () => ({ env: envMock }));

faker.seed(7163);

const MOCK_WORKER_URL = faker.internet.url({ appendSlash: false });
const MOCK_SECRET = faker.string.alphanumeric(32);
const MOCK_REQUEST = {
  tenantId: MOCK_TENANT_ID,
  postId: faker.string.uuid(),
  claimedAt: faker.date.recent().toISOString(),
};
const { postId: MOCK_POST_ID } = MOCK_REQUEST;

const loggerErrorMock = vi.mocked(logger.error);

describe(enqueueNewsletterPostSend, () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    envMock.WORKER_ENQUEUE_URL = MOCK_WORKER_URL;
    envMock.WORKER_ENQUEUE_SECRET = MOCK_SECRET;
    fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: HTTP_STATUS.ACCEPTED }));
    vi.stubGlobal('fetch', fetchMock);
  });

  it('posts the claim to the worker with a signature the worker accepts', async () => {
    expect(await enqueueNewsletterPostSend(MOCK_REQUEST)).toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = new Headers(init.headers);
    const rawBody = String(init.body);
    expect(url.href).toBe(`${MOCK_WORKER_URL}${NEWSLETTER_POST_SEND_PATH}`);
    expect(init.method).toBe(HTTP_METHOD.POST);
    expect(JSON.parse(rawBody)).toEqual(MOCK_REQUEST);
    expect(
      isValidEnqueueSignature({
        secret: MOCK_SECRET,
        timestamp: headers.get(ENQUEUE_TIMESTAMP_HEADER),
        signature: headers.get(ENQUEUE_SIGNATURE_HEADER),
        path: NEWSLETTER_POST_SEND_PATH,
        rawBody,
      }),
    ).toBe(true);
  });

  it.each([
    ['worker url', 'WORKER_ENQUEUE_URL'],
    ['secret', 'WORKER_ENQUEUE_SECRET'],
  ] as const)(
    'logs and sends nothing without the %s',
    async (_label, variable) => {
      envMock[variable] = undefined;

      expect(await enqueueNewsletterPostSend(MOCK_REQUEST)).toBe(false);

      expect(fetchMock).not.toHaveBeenCalled();
      expect(loggerErrorMock).toHaveBeenCalledWith(
        REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_SKIPPED,
        expect.objectContaining({
          tenantId: MOCK_TENANT_ID,
          postId: MOCK_POST_ID,
        }),
      );
    },
  );

  it('logs the status when the worker refuses the run', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, { status: HTTP_STATUS.CONFLICT }),
    );

    expect(await enqueueNewsletterPostSend(MOCK_REQUEST)).toBe(false);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_REFUSED,
      {
        tenantId: MOCK_TENANT_ID,
        postId: MOCK_POST_ID,
        status: HTTP_STATUS.CONFLICT,
      },
    );
  });

  it('logs and resolves when the worker cannot be reached', async () => {
    fetchMock.mockRejectedValue(MOCK_ERROR);

    expect(await enqueueNewsletterPostSend(MOCK_REQUEST)).toBe(false);

    expect(loggerErrorMock).toHaveBeenCalledWith(
      REVALIDATE_LOG.NEWSLETTER_SEND_ENQUEUE_FAILED,
      { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID, error: MOCK_ERROR },
    );
  });
});
