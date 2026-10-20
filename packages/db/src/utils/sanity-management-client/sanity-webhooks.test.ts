import {
  firstFetchCall,
  jsonResponse,
  SANITY_TEST_PROJECT_ID,
  SANITY_WEBHOOKS_API_BASE,
  textResponse,
  useFetchFake,
  withSanityProject,
} from '@blog/db/testing/sanity-fetch';

import { createSanityWebhook, listSanityWebhooks } from './sanity-webhooks';

const HOOKS_URL = `${SANITY_WEBHOOKS_API_BASE}/hooks/projects/${SANITY_TEST_PROJECT_ID}`;
const HOOK_URL = 'https://web.example.com/api/revalidate';
const hook = { id: 'hook1', url: HOOK_URL };
const createInput = withSanityProject({
  dataset: 'production',
  name: 'web-revalidate',
  url: HOOK_URL,
  secret: 'shh',
});

const fetchMock = useFetchFake();

describe(listSanityWebhooks, () => {
  it('GETs the global hooks endpoint without following redirects', async () => {
    fetchMock.mockResolvedValue(jsonResponse([hook]));

    const result = await listSanityWebhooks(withSanityProject({}));

    const { url, init } = firstFetchCall(fetchMock);
    expect(result).toEqual([hook]);
    expect(url).toBe(HOOKS_URL);
    expect(init.method ?? 'GET').toBe('GET');
    expect(init.redirect).toBe('error');
  });

  it('explains project membership when the management token is unauthorized', async () => {
    fetchMock.mockResolvedValue(textResponse('Unauthorized', 401));

    await expect(listSanityWebhooks(withSanityProject({}))).rejects.toThrow(
      new RegExp(`401 .*not a member of project "${SANITY_TEST_PROJECT_ID}"`),
    );
  });
});

describe(createSanityWebhook, () => {
  it('POSTs a document webhook for create, update and delete events', async () => {
    fetchMock.mockResolvedValue(jsonResponse(hook));

    const result = await createSanityWebhook(createInput);

    const { url, init, body } = firstFetchCall(fetchMock);
    expect(result).toEqual(hook);
    expect(url).toBe(HOOKS_URL);
    expect(init.method).toBe('POST');
    expect(init.redirect).toBe('error');
    expect(body).toEqual({
      type: 'document',
      name: createInput.name,
      dataset: createInput.dataset,
      url: HOOK_URL,
      apiVersion: 'v2021-06-07',
      httpMethod: 'POST',
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
    { case: 'the response body is empty', response: textResponse('', 201) },
  ])('throws naming the project when $case', async ({ response }) => {
    fetchMock.mockResolvedValue(response);

    await expect(createSanityWebhook(createInput)).rejects.toThrow(
      SANITY_TEST_PROJECT_ID,
    );
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(textResponse('nope', 402));

    await expect(createSanityWebhook(createInput)).rejects.toThrow(/402/);
  });
});
