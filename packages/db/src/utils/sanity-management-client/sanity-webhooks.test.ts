import { faker } from '@faker-js/faker';
import {
  HTTP_METHOD,
  HTTP_STATUS,
  SANITY_WEBHOOK_OPERATION,
} from '@shinefold/config';
import {
  firstFetchCall,
  jsonResponse,
  textResponse,
  useFetchFake,
} from '@shinefold/db/testing/sanity-management-client/fetch-fake';
import {
  MOCK_SANITY_DATASET,
  MOCK_SANITY_ERROR_BODY,
  MOCK_SANITY_EXPECTED_URL,
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_WEBHOOK_ID,
  MOCK_SANITY_WEBHOOK_URL,
  mockSanityProjectInput,
} from '@shinefold/db/testing/sanity-management-client/fixtures';

import {
  createSanityWebhook,
  REVALIDATE_WEBHOOK_PROJECTION,
  updateSanityWebhookProjection,
  updateSanityWebhookSecret,
  updateSanityWebhookUrl,
} from './sanity-webhooks';

faker.seed(2760);

const MOCK_WEBHOOK_NAME = faker.lorem.slug(2);
const MOCK_WEBHOOK_SECRET = faker.string.alphanumeric(12);
const MOCK_ROTATED_SECRET = faker.string.alphanumeric(12);
const MOCK_OTHER_URL = faker.internet.url({ appendSlash: false });
const MOCK_HOOK = { id: MOCK_SANITY_WEBHOOK_ID, url: MOCK_SANITY_WEBHOOK_URL };
const MOCK_EXPECTED_WEBHOOK_RULE = {
  on: [
    SANITY_WEBHOOK_OPERATION.CREATE,
    SANITY_WEBHOOK_OPERATION.UPDATE,
    SANITY_WEBHOOK_OPERATION.DELETE,
  ],
  projection: REVALIDATE_WEBHOOK_PROJECTION,
};
const MOCK_UPDATE_INPUT = mockSanityProjectInput({
  webhookId: MOCK_SANITY_WEBHOOK_ID,
});
const MOCK_CREATE_INPUT = mockSanityProjectInput({
  dataset: MOCK_SANITY_DATASET,
  name: MOCK_WEBHOOK_NAME,
  url: MOCK_SANITY_WEBHOOK_URL,
  secret: MOCK_WEBHOOK_SECRET,
});

const fetchMock = useFetchFake();

describe(createSanityWebhook, () => {
  it('POSTs a document webhook for create, update and delete events', async () => {
    fetchMock.mockResolvedValue(jsonResponse(MOCK_HOOK));

    const result = await createSanityWebhook(MOCK_CREATE_INPUT);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(MOCK_HOOK);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.webhooks);
    expect(method).toBe(HTTP_METHOD.POST);
    expect(body).toEqual({
      type: 'document',
      name: MOCK_CREATE_INPUT.name,
      dataset: MOCK_CREATE_INPUT.dataset,
      url: MOCK_SANITY_WEBHOOK_URL,
      apiVersion: 'v2021-06-07',
      httpMethod: HTTP_METHOD.POST,
      includeDrafts: false,
      rule: MOCK_EXPECTED_WEBHOOK_RULE,
      secret: MOCK_CREATE_INPUT.secret,
    });
  });

  it.each([
    { case: 'the response is a hook list', response: jsonResponse([]) },
    {
      case: 'the created hook targets a different URL',
      response: jsonResponse({
        id: MOCK_SANITY_WEBHOOK_ID,
        url: MOCK_OTHER_URL,
      }),
    },
    {
      case: 'the response body is empty',
      response: textResponse('', HTTP_STATUS.CREATED),
    },
  ])('throws naming the project when $case', async ({ response }) => {
    fetchMock.mockResolvedValue(response);

    await expect(createSanityWebhook(MOCK_CREATE_INPUT)).rejects.toThrow(
      MOCK_SANITY_PROJECT_ID,
    );
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.PAYMENT_REQUIRED),
    );

    await expect(createSanityWebhook(MOCK_CREATE_INPUT)).rejects.toThrow(
      new RegExp(`${HTTP_STATUS.PAYMENT_REQUIRED}`),
    );
  });
});

describe(updateSanityWebhookSecret, () => {
  const MOCK_SECRET_INPUT = {
    ...MOCK_UPDATE_INPUT,
    secret: MOCK_ROTATED_SECRET,
  };

  it('PATCHes only the secret of the named hook', async () => {
    fetchMock.mockResolvedValue(jsonResponse(MOCK_HOOK));

    await updateSanityWebhookSecret(MOCK_SECRET_INPUT);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.webhook);
    expect(method).toBe(HTTP_METHOD.PATCH);
    expect(body).toEqual({ secret: MOCK_SECRET_INPUT.secret });
  });

  it('throws naming the hook when the response is not that hook', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(updateSanityWebhookSecret(MOCK_SECRET_INPUT)).rejects.toThrow(
      MOCK_SANITY_WEBHOOK_ID,
    );
  });
});

describe(updateSanityWebhookUrl, () => {
  const MOCK_URL_INPUT = { ...MOCK_UPDATE_INPUT, url: MOCK_OTHER_URL };

  const MOCK_MOVED_HOOK = { ...MOCK_HOOK, url: MOCK_OTHER_URL };

  it('PATCHes only the URL of the named hook', async () => {
    fetchMock.mockResolvedValue(jsonResponse(MOCK_MOVED_HOOK));

    await updateSanityWebhookUrl(MOCK_URL_INPUT);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.webhook);
    expect(method).toBe(HTTP_METHOD.PATCH);
    expect(body).toEqual({ url: MOCK_OTHER_URL });
  });

  it('throws naming the hook when the response is not the moved hook', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(updateSanityWebhookUrl(MOCK_URL_INPUT)).rejects.toThrow(
      MOCK_SANITY_WEBHOOK_ID,
    );
  });

  it('throws naming the hook when the answered hook keeps its old URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse(MOCK_HOOK));

    await expect(updateSanityWebhookUrl(MOCK_URL_INPUT)).rejects.toThrow(
      MOCK_SANITY_WEBHOOK_ID,
    );
  });

  it('throws with the response status and body when Sanity refuses the move', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.BAD_REQUEST),
    );

    await expect(updateSanityWebhookUrl(MOCK_URL_INPUT)).rejects.toThrow(
      new RegExp(`${HTTP_STATUS.BAD_REQUEST}.*${MOCK_SANITY_ERROR_BODY}`),
    );
  });
});

describe(updateSanityWebhookProjection, () => {
  it('PATCHes only the rule of the named hook, leaving its secret alone', async () => {
    fetchMock.mockResolvedValue(jsonResponse(MOCK_HOOK));

    await updateSanityWebhookProjection(MOCK_UPDATE_INPUT);

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.webhook);
    expect(method).toBe(HTTP_METHOD.PATCH);
    expect(body).toEqual({ rule: MOCK_EXPECTED_WEBHOOK_RULE });
  });

  it('throws naming the hook when the response is not the updated hook', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(
      updateSanityWebhookProjection(MOCK_UPDATE_INPUT),
    ).rejects.toThrow(MOCK_SANITY_WEBHOOK_ID);
  });

  it('throws with the response status on failure', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.BAD_REQUEST),
    );

    await expect(
      updateSanityWebhookProjection(MOCK_UPDATE_INPUT),
    ).rejects.toThrow(new RegExp(`${HTTP_STATUS.BAD_REQUEST}`));
  });
});
