import { HTTP_METHOD, HTTP_STATUS } from '@blog/config/constants';
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
} from '@blog/utils/enqueue-signature';
import { WEB_SCHEDULED_POST_PURGE_PATH } from '@worker/constants/scheduled-post-purge';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import { MOCK_SCHEDULED_POST_ID } from '@worker/testing/scheduled-post-purge/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { env as mockEnv } from '@worker/utils/env/__mocks__/env';
import { FatalError } from 'workflow';

import { purgeScheduledPostPages } from './purge-scheduled-post-pages';

vi.mock('@worker/utils/env/env');
vi.mock('workflow');

const { webAppBaseUrl, revalidateSecret } = MOCK_PROVISION_ENV;

const fetchMock = vi.fn();

function runPurge() {
  return purgeScheduledPostPages(MOCK_TENANT_ID, MOCK_SCHEDULED_POST_ID);
}

describe(purgeScheduledPostPages, () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    mockEnv.WEB_APP_URL = webAppBaseUrl;
    mockEnv.SANITY_REVALIDATE_SECRET = revalidateSecret;
    fetchMock.mockResolvedValue(new Response('{}', { status: HTTP_STATUS.OK }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the post to web's purge route, signed with the revalidate secret", async () => {
    await runPurge();

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const headers = new Headers(init.headers);
    const rawBody = String(init.body);
    expect(String(url)).toBe(
      `${webAppBaseUrl}${WEB_SCHEDULED_POST_PURGE_PATH}`,
    );
    expect(init.method).toBe(HTTP_METHOD.POST);
    expect(JSON.parse(rawBody)).toEqual({
      tenantId: MOCK_TENANT_ID,
      postId: MOCK_SCHEDULED_POST_ID,
    });
    expect(
      isValidEnqueueSignature({
        secret: revalidateSecret,
        timestamp: headers.get(ENQUEUE_TIMESTAMP_HEADER),
        signature: headers.get(ENQUEUE_SIGNATURE_HEADER),
        path: WEB_SCHEDULED_POST_PURGE_PATH,
        rawBody,
      }),
    ).toBe(true);
  });

  it('throws so the step retries when web refuses the purge', async () => {
    fetchMock.mockResolvedValue(
      new Response('', { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }),
    );

    await expect(runPurge()).rejects.toThrow(
      String(HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );
  });

  it.each(['WEB_APP_URL', 'SANITY_REVALIDATE_SECRET'])(
    'fails for good without calling web when %s is unset',
    async (name) => {
      mockEnv[name] = undefined;

      await expect(runPurge()).rejects.toThrow(FatalError);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );
});
