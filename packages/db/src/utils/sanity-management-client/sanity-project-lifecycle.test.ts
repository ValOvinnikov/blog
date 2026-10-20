import {
  SANITY_PROJECT_ARCHIVE_OUTCOME,
  SANITY_PROJECT_DELETE_OUTCOME,
  SANITY_PROJECT_UNARCHIVE_OUTCOME,
} from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';

import {
  archiveSanityProject,
  deleteSanityProject,
  unarchiveSanityProject,
} from './sanity-project-lifecycle';

const fetchMock = vi.fn();

const TOKEN = faker.string.alphanumeric(24);
const PROJECT_ID = faker.string.alphanumeric(8).toLowerCase();
const INPUT = { token: TOKEN, projectId: PROJECT_ID };
const SANITY_EXPECTED_URL = {
  project: `https://api.sanity.io/v2021-06-07/projects/${PROJECT_ID}`,
};
const BILLING_401_BODY = JSON.stringify({
  code: 401,
  status: 'Unauthorized',
  message: `Cancellation of project "${PROJECT_ID}" requires billing permission on organization "org1"`,
});

function okResponse(): Response {
  return new Response('{}', { status: 200 });
}
function errorResponse(status: number, body = 'error'): Response {
  return new Response(body, { status });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(deleteSanityProject, () => {
  it('sends an abort signal so a hung call fails instead of stalling the run', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await deleteSanityProject(INPUT);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('DELETEs the project', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const result = await deleteSanityProject(INPUT);

    expect(result).toEqual(toOutcome(SANITY_PROJECT_DELETE_OUTCOME.DELETED));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(SANITY_EXPECTED_URL.project);
    expect(init.method).toBe('DELETE');
  });

  it('treats a 404 as already gone rather than an error', async () => {
    fetchMock.mockResolvedValue(errorResponse(404, 'not found'));

    const result = await deleteSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_DELETE_OUTCOME.ALREADY_GONE),
    );
  });

  it('throws with the response status and body on failure', async () => {
    fetchMock.mockResolvedValue(errorResponse(403, 'forbidden'));

    await expect(deleteSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API DELETE /projects/${PROJECT_ID} failed: 403 forbidden`,
    );
  });

  it('reports blocked by billing permission on the billing 401 without throwing', async () => {
    fetchMock.mockResolvedValue(errorResponse(401, BILLING_401_BODY));

    const result = await deleteSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_DELETE_OUTCOME.BLOCKED_BY_BILLING_PERMISSION),
    );
  });

  it('still throws on a 401 unrelated to billing permission', async () => {
    fetchMock.mockResolvedValue(errorResponse(401, 'invalid token'));

    await expect(deleteSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API DELETE /projects/${PROJECT_ID} failed: 401 invalid token`,
    );
  });
});

function projectResponse(isDisabledByUser: boolean): Response {
  return new Response(
    JSON.stringify({ id: PROJECT_ID, isDisabled: false, isDisabledByUser }),
    { status: 200 },
  );
}

describe(archiveSanityProject, () => {
  it('sends an abort signal on both the GET and the PATCH', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(false))
      .mockResolvedValueOnce(okResponse());

    await archiveSanityProject(INPUT);

    for (const [, init] of fetchMock.mock.calls as [string, RequestInit][]) {
      expect(init.signal).toBeInstanceOf(AbortSignal);
    }
  });

  it('GETs, then PATCHes isDisabledByUser to true when not already archived', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(false))
      .mockResolvedValueOnce(okResponse());

    const result = await archiveSanityProject(INPUT);

    expect(result).toEqual(toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ARCHIVED));
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [getUrl, getInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(getUrl).toBe(SANITY_EXPECTED_URL.project);
    expect(getInit.method).toBeUndefined();

    const [patchUrl, patchInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(patchUrl).toBe(SANITY_EXPECTED_URL.project);
    expect(patchInit.method).toBe('PATCH');
    expect(patchInit.body).toBe(JSON.stringify({ isDisabledByUser: true }));
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
    fetchMock.mockResolvedValueOnce(errorResponse(404, 'not found'));

    const result = await archiveSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_ARCHIVE_OUTCOME.ALREADY_GONE),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the GET fails for a reason other than 404', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(403, 'forbidden'));

    await expect(archiveSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API GET /projects/${PROJECT_ID} failed: 403 forbidden`,
    );
  });

  it('throws when the PATCH fails', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(false))
      .mockResolvedValueOnce(errorResponse(500, 'server error'));

    await expect(archiveSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API PATCH /projects/${PROJECT_ID} failed: 500 server error`,
    );
  });
});

describe(unarchiveSanityProject, () => {
  it('GETs, then PATCHes isDisabledByUser to false when currently archived', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(true))
      .mockResolvedValueOnce(okResponse());

    const result = await unarchiveSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_UNARCHIVE_OUTCOME.UNARCHIVED),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [patchUrl, patchInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(patchUrl).toBe(SANITY_EXPECTED_URL.project);
    expect(patchInit.method).toBe('PATCH');
    expect(patchInit.body).toBe(JSON.stringify({ isDisabledByUser: false }));
  });

  it('is idempotent — skips the PATCH when the project is already active', async () => {
    fetchMock.mockResolvedValueOnce(projectResponse(false));

    const result = await unarchiveSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_UNARCHIVE_OUTCOME.ALREADY_ACTIVE),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('treats a 404 on the GET as already gone rather than an error', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(404, 'not found'));

    const result = await unarchiveSanityProject(INPUT);

    expect(result).toEqual(
      toOutcome(SANITY_PROJECT_UNARCHIVE_OUTCOME.ALREADY_GONE),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws when the GET fails for a reason other than 404', async () => {
    fetchMock.mockResolvedValueOnce(errorResponse(403, 'forbidden'));

    await expect(unarchiveSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API GET /projects/${PROJECT_ID} failed: 403 forbidden`,
    );
  });

  it('throws when the PATCH fails', async () => {
    fetchMock
      .mockResolvedValueOnce(projectResponse(true))
      .mockResolvedValueOnce(errorResponse(500, 'server error'));

    await expect(unarchiveSanityProject(INPUT)).rejects.toThrow(
      `Sanity Management API PATCH /projects/${PROJECT_ID} failed: 500 server error`,
    );
  });
});
