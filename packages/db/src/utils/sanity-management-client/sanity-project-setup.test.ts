import {
  emptyResponse,
  firstFetchCall,
  jsonResponse,
  SANITY_TEST_PROJECT_ID,
  SANITY_TEST_TOKEN,
  textResponse,
  useFetchFake,
  withSanityProject,
} from '@blog/db/testing/sanity-fetch';

import { SANITY_MANAGEMENT_API_BASE } from './sanity-api-request';
import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  listSanityCorsOrigins,
  listSanityDatasets,
} from './sanity-project-setup';

const ORIGIN = 'https://admin.example.com';
const PROJECT_URL = `${SANITY_MANAGEMENT_API_BASE}/projects/${SANITY_TEST_PROJECT_ID}`;
const createProjectInput = {
  token: SANITY_TEST_TOKEN,
  displayName: 'Acme',
  organizationId: 'org-abc',
};

const fetchMock = useFetchFake();

describe(createSanityProject, () => {
  it('POSTs to /projects with the display name and organization id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: SANITY_TEST_PROJECT_ID }));

    const result = await createSanityProject(createProjectInput);

    const { url, init, body, headers } = firstFetchCall(fetchMock);
    expect(result).toEqual({ id: SANITY_TEST_PROJECT_ID });
    expect(url).toBe(`${SANITY_MANAGEMENT_API_BASE}/projects`);
    expect(init.method).toBe('POST');
    expect(body).toEqual({
      displayName: createProjectInput.displayName,
      organizationId: createProjectInput.organizationId,
    });
    expect(headers['Authorization']).toBe(`Bearer ${SANITY_TEST_TOKEN}`);
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(textResponse('nope', 402));

    await expect(createSanityProject(createProjectInput)).rejects.toThrow(
      /402/,
    );
  });

  it('sends an abort signal so a hung call fails instead of stalling the run', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: SANITY_TEST_PROJECT_ID }));

    await createSanityProject(createProjectInput);

    expect(firstFetchCall(fetchMock).init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe(createSanityDataset, () => {
  it('PUTs the dataset with a public aclMode', async () => {
    fetchMock.mockResolvedValue(emptyResponse());

    await createSanityDataset(withSanityProject({ dataset: 'production' }));

    const { url, init, body } = firstFetchCall(fetchMock);
    expect(url).toBe(`${PROJECT_URL}/datasets/production`);
    expect(init.method).toBe('PUT');
    expect(body).toEqual({ aclMode: 'public' });
  });
});

describe(listSanityDatasets, () => {
  it('GETs the project-scoped datasets endpoint and returns the list', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ name: 'production' }]));

    const result = await listSanityDatasets(withSanityProject({}));

    const { url, init } = firstFetchCall(fetchMock);
    expect(result).toEqual([{ name: 'production' }]);
    expect(url).toBe(`${PROJECT_URL}/datasets`);
    expect(init.method ?? 'GET').toBe('GET');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe(addSanityCorsOrigin, () => {
  it('POSTs to /projects/:id/cors with credentials allowed', async () => {
    fetchMock.mockResolvedValue(emptyResponse());

    await addSanityCorsOrigin(
      withSanityProject({ origin: ORIGIN, allowCredentials: true }),
    );

    const { url, init, body } = firstFetchCall(fetchMock);
    expect(url).toBe(`${PROJECT_URL}/cors`);
    expect(init.method).toBe('POST');
    expect(body).toEqual({ origin: ORIGIN, allowCredentials: true });
  });
});

describe(listSanityCorsOrigins, () => {
  it('GETs the project-scoped cors endpoint and returns the list', async () => {
    const origins = [{ id: 'cors1', origin: ORIGIN }];
    fetchMock.mockResolvedValue(jsonResponse(origins));

    const result = await listSanityCorsOrigins(withSanityProject({}));

    const { url, init } = firstFetchCall(fetchMock);
    expect(result).toEqual(origins);
    expect(url).toBe(`${PROJECT_URL}/cors`);
    expect(init.method ?? 'GET').toBe('GET');
  });
});
