import {
  SANITY_PROJECT_ARCHIVE_OUTCOME,
  SANITY_PROJECT_DELETE_OUTCOME,
  SANITY_PROJECT_UNARCHIVE_OUTCOME,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@blog/config';
import {
  emptyResponse,
  firstFetchCall,
  jsonResponse,
  nthFetchCall,
  textResponse,
  useFetchFake,
} from '@blog/db/testing/sanity-management-client/fetch-fake';
import {
  MOCK_SANITY_EXPECTED_URL,
  MOCK_SANITY_PROJECT_ID,
  mockSanityProjectInput,
} from '@blog/db/testing/sanity-management-client/fixtures';
import { toOutcome } from '@blog/utils/to-outcome';

import {
  archiveSanityProject,
  deleteSanityProject,
  unarchiveSanityProject,
} from './sanity-project-lifecycle';

const fetchMock = useFetchFake();

const INPUT = mockSanityProjectInput({});
const MOCK_NOT_FOUND_BODY = 'not found';
const MOCK_FORBIDDEN_BODY = 'forbidden';
const MOCK_SERVER_ERROR_BODY = 'server error';
const BILLING_401_BODY = JSON.stringify({
  code: HTTP_STATUS.UNAUTHORIZED,
  status: 'Unauthorized',
  message: `Cancellation of project "${MOCK_SANITY_PROJECT_ID}" requires billing permission on organization "org1"`,
});

function managementApiError(method: string, status: number, body: string) {
  return `Sanity Management API ${method} /projects/${MOCK_SANITY_PROJECT_ID} failed: ${status} ${body}`;
}

function projectResponse(isDisabledByUser: boolean): Response {
  return new Response(
    JSON.stringify({
      id: MOCK_SANITY_PROJECT_ID,
      isDisabled: false,
      isDisabledByUser,
    }),
    { status: HTTP_STATUS.OK },
  );
}

describe(deleteSanityProject, () => {
  it('sends an abort signal so a hung call fails instead of stalling the run', async () => {
    fetchMock.mockResolvedValue(emptyResponse());

    await deleteSanityProject(INPUT);

    const { init } = firstFetchCall(fetchMock);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('DELETEs the project', async () => {
    fetchMock.mockResolvedValue(emptyResponse());

    const result = await deleteSanityProject(INPUT);

    expect(result).toEqual(toOutcome(SANITY_PROJECT_DELETE_OUTCOME.DELETED));
    const { url, method } = firstFetchCall(fetchMock);
    expect(url).toBe(MOCK_SANITY_EXPECTED_URL.project);
    expect(method).toBe(HTTP_METHOD.DELETE);
  });

  it('treats a 404 as already gone rather than an error', async () => {
    fetchMock.mockResolvedValue(
      textResponse(MOCK_NOT_FOUND_BODY, HTTP_STATUS.NOT_FOUND),
    );

    const result = await deleteSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_DELETE_OUTCOME.ALREADY_GONE),
    );
  });

  it('reports blocked by billing permission on the billing 401 without throwing', async () => {
    fetchMock.mockResolvedValue(
      textResponse(BILLING_401_BODY, HTTP_STATUS.UNAUTHORIZED),
    );

    const result = await deleteSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_DELETE_OUTCOME.BLOCKED_BY_BILLING_PERMISSION),
    );
  });

  it.each([
    { status: HTTP_STATUS.FORBIDDEN, body: MOCK_FORBIDDEN_BODY },
    { status: HTTP_STATUS.UNAUTHORIZED, body: 'invalid token' },
  ])(
    'throws with the response status and body on a $status failure',
    async ({ status, body }) => {
      fetchMock.mockResolvedValue(textResponse(body, status));

      await expect(deleteSanityProject(INPUT)).rejects.toThrow(
        managementApiError(HTTP_METHOD.DELETE, status, body),
      );
    },
  );
});

describe.each([
  {
    name: 'archiveSanityProject',
    run: archiveSanityProject,
    isDisabledByUser: false,
    outcome: SANITY_PROJECT_ARCHIVE_OUTCOME.ARCHIVED,
    alreadyOutcome: SANITY_PROJECT_ARCHIVE_OUTCOME.ALREADY_ARCHIVED,
    goneOutcome: SANITY_PROJECT_ARCHIVE_OUTCOME.ALREADY_GONE,
  },
  {
    name: 'unarchiveSanityProject',
    run: unarchiveSanityProject,
    isDisabledByUser: true,
    outcome: SANITY_PROJECT_UNARCHIVE_OUTCOME.UNARCHIVED,
    alreadyOutcome: SANITY_PROJECT_UNARCHIVE_OUTCOME.ALREADY_ACTIVE,
    goneOutcome: SANITY_PROJECT_UNARCHIVE_OUTCOME.ALREADY_GONE,
  },
])(
  '$name',
  ({ run, isDisabledByUser, outcome, alreadyOutcome, goneOutcome }) => {
    it('GETs, then PATCHes isDisabledByUser to the opposite value', async () => {
      fetchMock
        .mockResolvedValueOnce(projectResponse(isDisabledByUser))
        .mockResolvedValueOnce(jsonResponse({}));

      const result = await run(INPUT);

      expect(result).toEqual(toOutcome(outcome));
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const get = nthFetchCall(fetchMock, 0);
      expect(get.url).toBe(MOCK_SANITY_EXPECTED_URL.project);
      expect(get.method).toBe(HTTP_METHOD.GET);
      const patch = nthFetchCall(fetchMock, 1);
      expect(patch.url).toBe(MOCK_SANITY_EXPECTED_URL.project);
      expect(patch.method).toBe(HTTP_METHOD.PATCH);
      expect(patch.body).toEqual({ isDisabledByUser: !isDisabledByUser });
    });

    it('sends an abort signal on both the GET and the PATCH', async () => {
      fetchMock
        .mockResolvedValueOnce(projectResponse(isDisabledByUser))
        .mockResolvedValueOnce(jsonResponse({}));

      await run(INPUT);

      expect(nthFetchCall(fetchMock, 0).init.signal).toBeInstanceOf(
        AbortSignal,
      );
      expect(nthFetchCall(fetchMock, 1).init.signal).toBeInstanceOf(
        AbortSignal,
      );
    });

    it('skips the PATCH when the project is already in the target state', async () => {
      fetchMock.mockResolvedValueOnce(projectResponse(!isDisabledByUser));

      const result = await run(INPUT);

      expect(result).toEqual(toOutcome(alreadyOutcome));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('treats a 404 on the GET as already gone rather than an error', async () => {
      fetchMock.mockResolvedValueOnce(
        textResponse(MOCK_NOT_FOUND_BODY, HTTP_STATUS.NOT_FOUND),
      );

      const result = await run(INPUT);

      expect(result).toEqual(toOutcome(goneOutcome));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('throws when the GET fails for a reason other than 404', async () => {
      fetchMock.mockResolvedValueOnce(
        textResponse(MOCK_FORBIDDEN_BODY, HTTP_STATUS.FORBIDDEN),
      );

      await expect(run(INPUT)).rejects.toThrow(
        managementApiError(
          HTTP_METHOD.GET,
          HTTP_STATUS.FORBIDDEN,
          MOCK_FORBIDDEN_BODY,
        ),
      );
    });

    it('throws when the PATCH fails', async () => {
      fetchMock
        .mockResolvedValueOnce(projectResponse(isDisabledByUser))
        .mockResolvedValueOnce(
          textResponse(
            MOCK_SERVER_ERROR_BODY,
            HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ),
        );

      await expect(run(INPUT)).rejects.toThrow(
        managementApiError(
          HTTP_METHOD.PATCH,
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          MOCK_SERVER_ERROR_BODY,
        ),
      );
    });
  },
);
