import { faker } from '@faker-js/faker';
import { HTTP_METHOD, HTTP_STATUS } from '@shinefold/config';
import {
  firstFetchCall,
  jsonResponse,
  textResponse,
  useFetchFake,
} from '@shinefold/db/testing/sanity-management-client/fetch-fake';
import {
  MOCK_SANITY_ERROR_BODY,
  MOCK_SANITY_EXPECTED_URL,
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_WEBHOOK_ID,
  MOCK_SANITY_WEBHOOK_URL,
  mockSanityProjectInput,
} from '@shinefold/db/testing/sanity-management-client/fixtures';

import { listSanityWebhooks } from './sanity-webhooks-list';

faker.seed(7828);

const REDIRECT_MODE_ERROR = 'error';
const MOCK_STALE_PROJECTION = '{_type, _id}';
const MOCK_LISTED_HOOK = {
  id: MOCK_SANITY_WEBHOOK_ID,
  name: faker.lorem.slug(2),
  url: MOCK_SANITY_WEBHOOK_URL,
};

const fetchMock = useFetchFake();

describe(listSanityWebhooks, () => {
  it('GETs the global hooks endpoint without following redirects', async () => {
    fetchMock.mockResolvedValue(jsonResponse([MOCK_LISTED_HOOK]));

    const result = await listSanityWebhooks(mockSanityProjectInput({}));

    const { url, init, method } = firstFetchCall(fetchMock);
    expect(result).toEqual([{ ...MOCK_LISTED_HOOK, projection: null }]);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.webhooks);
    expect(method).toBe(HTTP_METHOD.GET);
    expect(init.redirect).toBe(REDIRECT_MODE_ERROR);
  });

  it('exposes each hook rule projection', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        { ...MOCK_LISTED_HOOK, rule: { projection: MOCK_STALE_PROJECTION } },
      ]),
    );

    const result = await listSanityWebhooks(mockSanityProjectInput({}));

    expect(result).toEqual([
      { ...MOCK_LISTED_HOOK, projection: MOCK_STALE_PROJECTION },
    ]);
  });

  it('explains project membership when the management token is unauthorized', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.UNAUTHORIZED),
    );

    await expect(
      listSanityWebhooks(mockSanityProjectInput({})),
    ).rejects.toThrow(
      new RegExp(
        `${HTTP_STATUS.UNAUTHORIZED} .*not a member of project "${MOCK_SANITY_PROJECT_ID}"`,
      ),
    );
  });
});
