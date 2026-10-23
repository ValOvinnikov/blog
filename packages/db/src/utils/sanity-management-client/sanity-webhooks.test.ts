import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import {
  firstFetchCall,
  jsonResponse,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_EXPECTED_URL,
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_WEBHOOK_ID,
  MOCK_SANITY_WEBHOOK_URL,
  mockSanityProjectInput,
} from '@blog/db/testing/sanity-management-client/fixtures';

import {
  createSanityWebhook,
  listSanityWebhooks,
  updateSanityWebhookSecret,
} from './sanity-webhooks';

const REDIRECT_MODE_ERROR = 'error';
const hook = { id: MOCK_SANITY_WEBHOOK_ID, url: MOCK_SANITY_WEBHOOK_URL };
const createInput = mockSanityProjectInput({
  dataset: MOCK_SANITY_DATASET,
  name: 'web-revalidate',
  url: MOCK_SANITY_WEBHOOK_URL,
  secret: 'shh',
});

const fetchMock = useFetchFake();

describe(listSanityWebhooks, () => {
  it('GETs the global hooks endpoint without following redirects', async () => {
    fetchMock.mockResolvedValue(jsonResponse([hook]));

    const result = await listSanityWebhooks(mockSanityProjectInput({}));

    const { url, init, method } = firstFetchCall(fetchMock);
    expect(result).toEqual([hook]);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.webhooks);
    expect(method).toBe(HTTP_METHOD.GET);
    expect(init.redirect).toBe(REDIRECT_MODE_ERROR);
  });

  it('explains project membership when the management token is unauthorized', async () => {
    fetchMock.mockResolvedValue(
      textResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED),
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

describe(createSanityWebhook, () => {
  it('POSTs a document webhook for create, update and delete events', async () => {
    fetchMock.mockResolvedValue(jsonResponse(hook));

    const result = await createSanityWebhook(createInput);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(hook);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.webhooks);
    expect(method).toBe(HTTP_METHOD.POST);
    expect(body).toEqual({
      type: 'document',
      name: createInput.name,
      dataset: createInput.dataset,
      url: MOCK_SANITY_WEBHOOK_URL,
      apiVersion: 'v2021-06-07',
      httpMethod: HTTP_METHOD.POST,
      includeDrafts: false,
      rule: {
        on: ['create', 'update', 'delete'],
        projection: '{_type, _id, "slug": slug.current}',
      },
      secret: createInput.secret,
    });
  });

  it.each([
    { case: 'the response is a hook list', response: jsonResponse([]) },
    {
      case: 'the created hook targets a different URL',
      response: jsonResponse({
        id: MOCK_SANITY_WEBHOOK_ID,
        url: 'https://other.example.com',
      }),
    },
    {
      case: 'the response body is empty',
      response: textResponse('', HTTP_STATUS.CREATED),
    },
  ])('throws naming the project when $case', async ({ response }) => {
    fetchMock.mockResolvedValue(response);

    await expect(createSanityWebhook(createInput)).rejects.toThrow(
      MOCK_SANITY_PROJECT_ID,
    );
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      textResponse('nope', HTTP_STATUS.PAYMENT_REQUIRED),
    );

    await expect(createSanityWebhook(createInput)).rejects.toThrow(
      new RegExp(`${HTTP_STATUS.PAYMENT_REQUIRED}`),
    );
  });
});

describe(updateSanityWebhookSecret, () => {
  const updateInput = mockSanityProjectInput({
    webhookId: MOCK_SANITY_WEBHOOK_ID,
    secret: 'rotated-shh',
  });

  it('PATCHes only the secret of the named hook', async () => {
    fetchMock.mockResolvedValue(jsonResponse(hook));

    await updateSanityWebhookSecret(updateInput);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.webhook);
    expect(method).toBe(HTTP_METHOD.PATCH);
    expect(body).toEqual({ secret: updateInput.secret });
  });

  it('throws naming the hook when the response is not that hook', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(updateSanityWebhookSecret(updateInput)).rejects.toThrow(
      MOCK_SANITY_WEBHOOK_ID,
    );
  });
});
