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
  SANITY_EXPECTED_URL,
  SANITY_PROJECT_ID,
  withSanityProject,
} from '@blog/db/testing/sanity-management-client/fixtures';
import { toOutcome } from '@blog/utils/to-outcome';

import {
  archiveSanityProject,
  deleteSanityProject,
  unarchiveSanityProject,
} from './sanity-project-lifecycle';

const fetchMock = useFetchFake();

const INPUT = withSanityProject({});
const BILLING_401_BODY = JSON.stringify({
  code: HTTP_STATUS.UNAUTHORIZED,
  status: 'Unauthorized',
  message: `Cancellation of project "${SANITY_PROJECT_ID}" requires billing permission on organization "org1"`,
});

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
    expect(url).toBe(SANITY_EXPECTED_URL.project);
    expect(method).toBe(HTTP_METHOD.DELETE);
  });

  it('treats a 404 as already gone rather than an error', async () => {
    fetchMock.mockResolvedValue(
      textResponse('not found', HTTP_STATUS.NOT_FOUND),
    );

    const result = await deleteSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_DELETE_OUTCOME.ALREADY_GONE),
    );
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(
      textResponse('forbidden', HTTP_STATUS.FORBIDDEN),
    );

    await expect(deleteSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API DELETE /projects/${SANITY_PROJECT_ID} failed: ${HTTP_STATUS.FORBIDDEN} forbidden`,
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

  it('still throws on a 401 unrelated to billing permission', async () => {
    fetchMock.mockResolvedValue(
      textResponse('invalid token', HTTP_STATUS.UNAUTHORIZED),
    );

    await expect(deleteSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API DELETE /projects/${SANITY_PROJECT_ID} failed: ${HTTP_STATUS.UNAUTHORIZED} invalid token`,
    );
  });
});

function projectResponse(isDisabledByUser: boolean): Response {
  return new Response(
    JSON.stringify({
      id: SANITY_PROJECT_ID,
      isDisabled: false,
      isDisabledByUser,
    }),
    { status: HTTP_STATUS.OK },
  );
}

describe.each([
  {
    name: 'archiveSanityProject',
    run: archiveSanityProject,
    isDisabledByUser: false,
    outcome: SANITY_PROJECT_ARCHIVE_OUTCOME.ARCHIVED,
  },
  {
    name: 'unarchiveSanityProject',
    run: unarchiveSanityProject,
    isDisabledByUser: true,
    outcome: SANITY_PROJECT_UNARCHIVE_OUTCOME.UNARCHIVED,
  },
])('$name toggling', ({ run, isDisabledByUser, outcome }) => {
  it('GETs, then PATCHes isDisabledByUser to the opposite value', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(isDisabledByUser))
      .mockResolvedValueOnce(jsonResponse({}));

    const result = await run(INPUT);

    expect(result).toEqual(toOutcome(outcome));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const get = nthFetchCall(fetchMock, 0);
    expect(get.url).toBe(SANITY_EXPECTED_URL.project);
    expect(get.method).toBe(HTTP_METHOD.GET);
    const patch = nthFetchCall(fetchMock, 1);
    expect(patch.url).toBe(SANITY_EXPECTED_URL.project);
    expect(patch.method).toBe(HTTP_METHOD.PATCH);
    expect(patch.body).toEqual({ isDisabledByUser: !isDisabledByUser });
  });
});

describe(archiveSanityProject, () => {
  it('sends an abort signal on both the GET and the PATCH', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(false))
      .mockResolvedValueOnce(jsonResponse({}));

    await archiveSanityProject(INPUT);

    expect(nthFetchCall(fetchMock, 0).init.signal).toBeInstanceOf(AbortSignal);
    expect(nthFetchCall(fetchMock, 1).init.signal).toBeInstanceOf(AbortSignal);
  });

  it('is idempotent — skips the PATCH when the project is already archived', async () => {
    fetchMock.mockResolvedValueOnce(projectResponse(true));

    const result = await archiveSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ALREADY_ARCHIVED),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treats a 404 on the GET as already gone rather than an error', async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse('not found', HTTP_STATUS.NOT_FOUND),
    );

    const result = await archiveSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ALREADY_GONE),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the GET fails for a reason other than 404', async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse('forbidden', HTTP_STATUS.FORBIDDEN),
    );

    await expect(archiveSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API GET /projects/${SANITY_PROJECT_ID} failed: ${HTTP_STATUS.FORBIDDEN} forbidden`,
    );
  });

  it('throws when the PATCH fails', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(false))
      .mockResolvedValueOnce(
        textResponse('server error', HTTP_STATUS.INTERNAL_SERVER_ERROR),
      );

    await expect(archiveSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API PATCH /projects/${SANITY_PROJECT_ID} failed: ${HTTP_STATUS.INTERNAL_SERVER_ERROR} server error`,
    );
  });
});

describe(unarchiveSanityProject, () => {
  it('is idempotent — skips the PATCH when the project is already active', async () => {
    fetchMock.mockResolvedValueOnce(projectResponse(false));

    const result = await unarchiveSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_UNARCHIVE_OUTCOME.ALREADY_ACTIVE),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treats a 404 on the GET as already gone rather than an error', async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse('not found', HTTP_STATUS.NOT_FOUND),
    );

    const result = await unarchiveSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_UNARCHIVE_OUTCOME.ALREADY_GONE),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the GET fails for a reason other than 404', async () => {
    fetchMock.mockResolvedValueOnce(
      textResponse('forbidden', HTTP_STATUS.FORBIDDEN),
    );

    await expect(unarchiveSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API GET /projects/${SANITY_PROJECT_ID} failed: ${HTTP_STATUS.FORBIDDEN} forbidden`,
    );
  });

  it('throws when the PATCH fails', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(true))
      .mockResolvedValueOnce(
        textResponse('server error', HTTP_STATUS.INTERNAL_SERVER_ERROR),
      );

    await expect(unarchiveSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API PATCH /projects/${SANITY_PROJECT_ID} failed: ${HTTP_STATUS.INTERNAL_SERVER_ERROR} server error`,
    );
  });
});
