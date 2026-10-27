import { HTTP_STATUS } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import {
  GITHUB_FAILURE,
  GITHUB_RATE_LIMIT_EXHAUSTED,
  GITHUB_RATE_LIMIT_REMAINING_HEADER,
  GITHUB_LOG,
} from '@platform/constants/github';
import {
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

import { fetchGitHub, fetchGitHubJson, recoverNotFound } from './fetch-github';

faker.seed(5998);

vi.mock('@platform/utils/env/env');

const MOCK_FALLBACK = faker.lorem.word();
const MOCK_PATH = `/${faker.lorem.slug()}`;

describe(fetchGitHub, () => {
  const github = useGitHubFetch();

  it('returns the response for a 2xx', async () => {
    github.respond(MOCK_PATH, () => mockGitHubResponse({}));

    const result = await fetchGitHub(MOCK_PATH);

    expect(result.ok).toBe(true);
  });

  it('returns NOT_CONFIGURED without calling GitHub when no token is set', async () => {
    github.unsetToken();

    expect(await fetchGitHub(MOCK_PATH)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.NOT_CONFIGURED,
    });
    expect(github.fetchMock).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND for a 404 without logging it', async () => {
    expect(await fetchGitHub(MOCK_PATH)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.NOT_FOUND,
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it.each([
    [
      'an exhausted quota',
      () =>
        new Response(null, {
          status: HTTP_STATUS.FORBIDDEN,
          headers: {
            [GITHUB_RATE_LIMIT_REMAINING_HEADER]: GITHUB_RATE_LIMIT_EXHAUSTED,
          },
        }),
    ],
    [
      'a 429',
      () => new Response(null, { status: HTTP_STATUS.TOO_MANY_REQUESTS }),
    ],
  ])(
    'returns RATE_LIMITED for %s and logs it at warn',
    async (_label, respond) => {
      github.respond(MOCK_PATH, respond);

      expect(await fetchGitHub(MOCK_PATH)).toEqual({
        ok: false,
        error: GITHUB_FAILURE.RATE_LIMITED,
      });
      expect(logger.warn).toHaveBeenCalledWith(GITHUB_LOG.RATE_LIMITED, {
        path: MOCK_PATH,
      });
      expect(logger.error).not.toHaveBeenCalled();
    },
  );

  it('returns GITHUB_ERROR for a server error and logs its status', async () => {
    github.respond(
      MOCK_PATH,
      () => new Response(null, { status: HTTP_STATUS.BAD_GATEWAY }),
    );

    expect(await fetchGitHub(MOCK_PATH)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.GITHUB_ERROR,
    });
    expect(logger.error).toHaveBeenCalledWith(GITHUB_LOG.REQUEST_FAILED, {
      path: MOCK_PATH,
      responseStatus: HTTP_STATUS.BAD_GATEWAY,
    });
  });

  it('returns GITHUB_ERROR when the request itself fails', async () => {
    const thrown = new Error(faker.lorem.sentence());
    github.fetchMock.mockRejectedValue(thrown);

    expect(await fetchGitHub(MOCK_PATH)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.GITHUB_ERROR,
    });
    expect(logger.error).toHaveBeenCalledWith(GITHUB_LOG.REQUEST_ERROR, {
      path: MOCK_PATH,
      error: thrown,
    });
  });
});

describe(fetchGitHubJson, () => {
  const github = useGitHubFetch();
  it('returns the parsed body', async () => {
    const value = faker.lorem.word();
    github.respond(MOCK_PATH, () => mockGitHubResponse({ value }));

    const result = await fetchGitHubJson(
      MOCK_PATH,
      (body) => z.object({ value: z.string() }).parse(body).value,
    );

    expect(result).toEqual({ ok: true, data: value });
  });

  it('returns GITHUB_ERROR when the body does not parse', async () => {
    github.respond(MOCK_PATH, () => mockGitHubResponse({}));

    expect(
      await fetchGitHubJson(MOCK_PATH, () => {
        throw new Error(faker.lorem.sentence());
      }),
    ).toEqual({ ok: false, error: GITHUB_FAILURE.GITHUB_ERROR });
  });
});

describe(recoverNotFound, () => {
  it('turns a missing resource into the MOCK_FALLBACK', () => {
    expect(
      recoverNotFound(errorResult(GITHUB_FAILURE.NOT_FOUND), MOCK_FALLBACK),
    ).toEqual(okResult(MOCK_FALLBACK));
  });

  it('passes any other failure through', () => {
    const failure = errorResult(GITHUB_FAILURE.RATE_LIMITED);

    expect(recoverNotFound(failure, MOCK_FALLBACK)).toBe(failure);
  });
});
