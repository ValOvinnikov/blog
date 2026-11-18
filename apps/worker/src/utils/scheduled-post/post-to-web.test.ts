import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config/constants';
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
} from '@shinefold/utils/enqueue-signature';
import {
  RETRY_AFTER_HEADER,
  RETRY_AFTER_SECOND_MS,
} from '@worker/constants/retry-after';
import { SCHEDULED_POST_WEB_RETRYABLE_STATUSES } from '@worker/constants/scheduled-post';
import { MOCK_NOW, freezeClock } from '@worker/testing/clock/frozen-clock';
import { MOCK_POST_ID } from '@worker/testing/post/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { FatalError, RetryableError } from 'workflow';

import { postScheduledPostToWeb } from './post-to-web';

vi.mock('@worker/utils/env/env');
vi.mock('workflow');

const { webAppBaseUrl, revalidateSecret } = MOCK_PROVISION_ENV;

const fetchMock = vi.fn();
const MOCK_RETRY_SECONDS = 30;
const MOCK_WEB_PATH = '/api/scheduled-route';
const MOCK_TIMEOUT_MS = 5_000;
const MOCK_BODY = { tenantId: MOCK_TENANT_ID, postId: MOCK_POST_ID };

function runCall() {
  return postScheduledPostToWeb({
    path: MOCK_WEB_PATH,
    body: MOCK_BODY,
    timeoutMs: MOCK_TIMEOUT_MS,
    action: 'act',
  });
}

describe(postScheduledPostToWeb, () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    mockEnv.WEB_APP_URL = webAppBaseUrl;
    mockEnv.SANITY_REVALIDATE_SECRET = revalidateSecret;
    fetchMock.mockResolvedValue(new Response('{}', { status: HTTP_STATUS.OK }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('posts the body to the web path, signed with the revalidate secret', async () => {
    await runCall();

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = new Headers(init.headers);
    const rawBody = String(init.body);
    expect(String(url)).toBe(`${webAppBaseUrl}${MOCK_WEB_PATH}`);
    expect(init.method).toBe(HTTP_METHOD.POST);
    expect(JSON.parse(rawBody)).toEqual(MOCK_BODY);
    expect(
      isValidEnqueueSignature({
        secret: revalidateSecret,
        timestamp: headers.get(ENQUEUE_TIMESTAMP_HEADER),
        signature: headers.get(ENQUEUE_SIGNATURE_HEADER),
        path: MOCK_WEB_PATH,
        rawBody,
      }),
    ).toBe(true);
  });

  it.each([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.NOT_FOUND])(
    'fails for good when web answers %i',
    async (status) => {
      fetchMock.mockResolvedValue(new Response('', { status }));

      await expect(runCall()).rejects.toThrow(FatalError);
    },
  );

  it.each(SCHEDULED_POST_WEB_RETRYABLE_STATUSES)(
    'retries at the time web asks for when it answers %i',
    async (status) => {
      freezeClock();
      fetchMock.mockResolvedValue(
        new Response('', {
          status,
          headers: { [RETRY_AFTER_HEADER]: String(MOCK_RETRY_SECONDS) },
        }),
      );

      const error = await runCall().catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(RetryableError);
      expect((error as RetryableError).retryAfter).toEqual(
        new Date(
          MOCK_NOW.getTime() + MOCK_RETRY_SECONDS * RETRY_AFTER_SECOND_MS,
        ),
      );
    },
  );

  it.each([
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ...SCHEDULED_POST_WEB_RETRYABLE_STATUSES,
  ])(
    'retries on its own schedule when web answers %i without a retry time',
    async (status: number) => {
      fetchMock.mockResolvedValue(new Response('', { status }));

      const error = await runCall().catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(Error);
      expect(error).not.toBeInstanceOf(FatalError);
    },
  );

  it.each(['WEB_APP_URL', 'SANITY_REVALIDATE_SECRET'])(
    'fails for good without calling web when %s is unset',
    async (name) => {
      mockEnv[name] = undefined;

      await expect(runCall()).rejects.toThrow(FatalError);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
