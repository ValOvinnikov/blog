import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import {
  firstFetchCall,
  jsonResponse,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  SANITY_DATASET,
  SANITY_EXPECTED_URL,
  SANITY_PROJECT_ID,
  SANITY_WEBHOOK_URL,
  withSanityProject,
} from '@blog/db/testing/sanity-management-client/fixtures';

import { createSanityWebhook, listSanityWebhooks } from './sanity-webhooks';

const hook = { id: 'hook1', url: SANITY_WEBHOOK_URL };
const createInput = withSanityProject({
  dataset: SANITY_DATASET,
  name: 'web-revalidate',
  url: SANITY_WEBHOOK_URL,
  secret: 'shh',
});

const fetchMock = useFetchFake();

describe(listSanityWebhooks, () => {
  it('GETs the global hooks endpoint without following redirects', async () => {
    fetchMock.mockResolvedValue(jsonResponse([hook]));

    const result = await listSanityWebhooks(withSanityProject({}));

    const { url, init, method } = firstFetchCall(fetchMock);
    expect(result).toEqual([hook]);
    expect(url).toBe(SANITY_EXPECTED_URL.webhooks);
    expect(method).toBe(HTTP_METHOD.GET);
    expect(init.redirect).toBe('error');
  });

  it('explains project membership when the management token is unauthorized', async () => {
    fetchMock.mockResolvedValue(
      textResponse('Unauthorized', HTTP_STATUS.UNAUTHORIZED),
    );

    await expect(listSanityWebhooks(withSanityProject({}))).rejects.toThrow(
      new RegExp(
        `${HTTP_STATUS.UNAUTHORIZED} .*not a member of project "${SANITY_PROJECT_ID}"`,
      ),
    );
  });
});

describe(createSanityWebhook, () => {
  it('POSTs a document webhook for create, update and delete events', async () => {
    fetchMock.mockResolvedValue(jsonResponse(hook));

    const result = await createSanityWebhook(createInput);

    const { url, init, body, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(hook);
    expect(url).toBe(SANITY_EXPECTED_URL.webhooks);
    expect(method).toBe(HTTP_METHOD.POST);
    expect(init.redirect).toBe('error');
    expect(body).toEqual({
      type: 'document',
      name: createInput.name,
      dataset: createInput.dataset,
      url: SANITY_WEBHOOK_URL,
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
      response: jsonResponse({ id: 'hook1', url: 'https://other.example.com' }),
    },
    {
      case: 'the response body is empty',
      response: textResponse('', HTTP_STATUS.CREATED),
    },
  ])('throws naming the project when $case', async ({ response }) => {
    fetchMock.mockResolvedValue(response);

    await expect(createSanityWebhook(createInput)).rejects.toThrow(
      SANITY_PROJECT_ID,
    );
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      textResponse('nope', HTTP_STATUS.PAYMENT_REQUIRED),
    );

    await expect(createSanityWebhook(createInput)).rejects.toThrow(/402/);
  });
});
