import { HTTP_METHOD, HTTP_STATUS } from '@blog/config';
import {
  emptyResponse,
  firstFetchCall,
  jsonResponse,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  MOCK_SANITY_CORS_ORIGIN,
  MOCK_SANITY_DATASET,
  MOCK_SANITY_ERROR_BODY,
  MOCK_SANITY_EXPECTED_URL,
  MOCK_SANITY_ORGANIZATION_ID,
  MOCK_SANITY_PROJECT_ID,
  MOCK_SANITY_TOKEN,
  mockSanityProjectInput,
} from '@blog/db/testing/sanity-management-client/fixtures';
import { faker } from '@faker-js/faker';

import {
  addSanityCorsOrigin,
  createSanityDataset,
  createSanityProject,
  listSanityCorsOrigins,
  listSanityDatasets,
} from './sanity-project-setup';

faker.seed(5120);

const MOCK_CREATE_PROJECT_INPUT = {
  token: MOCK_SANITY_TOKEN,
  displayName: faker.company.name(),
  organizationId: MOCK_SANITY_ORGANIZATION_ID,
};
const MOCK_CORS_ID = faker.string.alphanumeric(8);

const fetchMock = useFetchFake();

describe(createSanityProject, () => {
  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_SANITY_ERROR_BODY, HTTP_STATUS.PAYMENT_REQUIRED),
    );

    await expect(
      createSanityProject(MOCK_CREATE_PROJECT_INPUT),
    ).rejects.toThrow(new RegExp(`${HTTP_STATUS.PAYMENT_REQUIRED}`));
  });

  describe('when Sanity creates the project', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue(jsonResponse({ id: MOCK_SANITY_PROJECT_ID }));
    });

    it('POSTs to /projects with the display name and organization id', async () => {
      const result = await createSanityProject(MOCK_CREATE_PROJECT_INPUT);

      const { url, body, headers, method } = firstFetchCall(fetchMock);
      expect(result).toEqual({ id: MOCK_SANITY_PROJECT_ID });
      expect(url).toBe(MOCK_SANITY_EXPECTED_URL.projects);
      expect(method).toBe(HTTP_METHOD.POST);
      expect(body).toEqual({
        displayName: MOCK_CREATE_PROJECT_INPUT.displayName,
        organizationId: MOCK_CREATE_PROJECT_INPUT.organizationId,
      });
      expect(headers['Authorization']).toBe(`Bearer ${MOCK_SANITY_TOKEN}`);
    });

    it('sends an abort signal so a hung call fails', async () => {
      await createSanityProject(MOCK_CREATE_PROJECT_INPUT);

      expect(firstFetchCall(fetchMock).init.signal).toBeInstanceOf(AbortSignal);
    });
  });
});

describe(createSanityDataset, () => {
  it('PUTs the dataset with a public aclMode', async () => {
    fetchMock.mockResolvedValue(emptyResponse());

    await createSanityDataset(
      mockSanityProjectInput({ dataset: MOCK_SANITY_DATASET }),
    );

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.dataset);
    expect(method).toBe(HTTP_METHOD.PUT);
    expect(body).toEqual({ aclMode: 'public' });
  });
});

describe(listSanityDatasets, () => {
  it('GETs the project-scoped datasets endpoint and returns the list', async () => {
    const datasets = [{ name: MOCK_SANITY_DATASET }];
    fetchMock.mockResolvedValue(jsonResponse(datasets));

    const result = await listSanityDatasets(mockSanityProjectInput({}));

    const { url, init, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(datasets);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.datasets);
    expect(method).toBe(HTTP_METHOD.GET);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe(addSanityCorsOrigin, () => {
  it('POSTs to /projects/:id/cors with credentials allowed', async () => {
    fetchMock.mockResolvedValue(emptyResponse());

    await addSanityCorsOrigin(
      mockSanityProjectInput({
        origin: MOCK_SANITY_CORS_ORIGIN,
        allowCredentials: true,
      }),
    );

    const { url, body, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.cors);
    expect(method).toBe(HTTP_METHOD.POST);
    expect(body).toEqual({
      origin: MOCK_SANITY_CORS_ORIGIN,
      allowCredentials: true,
    });
  });
});

describe(listSanityCorsOrigins, () => {
  it('GETs the project-scoped cors endpoint and returns the list', async () => {
    const origins = [{ id: MOCK_CORS_ID, origin: MOCK_SANITY_CORS_ORIGIN }];
    fetchMock.mockResolvedValue(jsonResponse(origins));

    const result = await listSanityCorsOrigins(mockSanityProjectInput({}));

    const { url, method } = firstFetchCall(fetchMock);
    expect(result).toEqual(origins);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.cors);
    expect(method).toBe(HTTP_METHOD.GET);
  });
});
