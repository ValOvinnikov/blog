import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import {
  emptyResponse,
  firstFetchCall,
  jsonResponse,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  SANITY_CORS_ORIGIN,
  SANITY_DATASET,
  SANITY_EXPECTED_URL,
  SANITY_PROJECT_ID,
  SANITY_TOKEN,
  withSanityProject,
} from '@blog/db/testing/sanity-management-client/fixtures';

import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  listSanityCorsOrigins,
  listSanityDatasets,
} from './sanity-project-setup';

const createProjectInput = {
  token: SANITY_TOKEN,
  displayName: 'Acme',
  organizationId: 'org-abc',
};

const fetchMock = useFetchFake();

describe(createSanityProject, () => {
  it('POSTs to /projects with the display name and organization id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: SANITY_PROJECT_ID }));

    const result = await createSanityProject(createProjectInput);

    const { url, body, headers, method } = firstFetchCall(fetchMock);
    expect(result).toEqual({ id: SANITY_PROJECT_ID });
    expect(url).toBe(SANITY_EXPECTED_URL.projects);
    expect(method).toBe(HTTP_METHOD.POST);
    expect(body).toEqual({
      displayName: createProjectInput.displayName,
      organizationId: createProjectInput.organizationId,
    });
    expect(headers['Authorization']).toBe(`Bearer ${SANITY_TOKEN}`);
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      textResponse('nope', HTTP_STATUS.PAYMENT_REQUIRED),
    );

    await expect(createSanityProject(createProjectInput)).rejects.toThrow(
      /402/,
    );
  });

  it('sends an abort signal so a hung call fails instead of stalling the run', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: SANITY_PROJECT_ID }));

    await createSanityProject(createProjectInput);

    expect(firstFetchCall(fetchMock).init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe(createSanityDataset, () => {
  it('PUTs the dataset with a public aclMode', async () => {
    fetchMock.mockResolvedValue(emptyResponse());

    await createSanityDataset(withSanityProject({ dataset: SANITY_DATASET }));

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(SANITY_EXPECTED_URL.dataset);
    expect(method).toBe(HTTP_METHOD.PUT);
    expect(body).toEqual({ aclMode: 'public' });
  });
});

describe(listSanityDatasets, () => {
  it('GETs the project-scoped datasets endpoint and returns the list', async () => {
    const datasets = [{ name: SANITY_DATASET }];
    fetchMock.mockResolvedValue(jsonResponse(datasets));

    const result = await listSanityDatasets(withSanityProject({}));

    const { url, init, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(datasets);
    expect(url).toBe(SANITY_EXPECTED_URL.datasets);
    expect(method).toBe(HTTP_METHOD.GET);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe(addSanityCorsOrigin, () => {
  it('POSTs to /projects/:id/cors with credentials allowed', async () => {
    fetchMock.mockResolvedValue(emptyResponse());

    await addSanityCorsOrigin(
      withSanityProject({ origin: SANITY_CORS_ORIGIN, allowCredentials: true }),
    );

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(SANITY_EXPECTED_URL.cors);
    expect(method).toBe(HTTP_METHOD.POST);
    expect(body).toEqual({
      origin: SANITY_CORS_ORIGIN,
      allowCredentials: true,
    });
  });
});

describe(listSanityCorsOrigins, () => {
  it('GETs the project-scoped cors endpoint and returns the list', async () => {
    const origins = [{ id: 'cors1', origin: SANITY_CORS_ORIGIN }];
    fetchMock.mockResolvedValue(jsonResponse(origins));

    const result = await listSanityCorsOrigins(withSanityProject({}));

    const { url, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(origins);
    expect(url).toBe(SANITY_EXPECTED_URL.cors);
    expect(method).toBe(HTTP_METHOD.GET);
  });
});
