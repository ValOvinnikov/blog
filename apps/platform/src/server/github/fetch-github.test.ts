import { HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  GITHUB_FAILURE,
  GITHUB_RATE_LIMIT_EXHAUSTED,
  GITHUB_RATE_LIMIT_REMAINING_HEADER,
} from '@platform/constants/github';
import {
  githubJson,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import { logger } from '@platform/utils/logger/logger';

import { fetchGitHub, fetchGitHubJson } from './fetch-github';

vi.mock('@platform/utils/env/env');

const loggerErrorMock = vi.mocked(logger.error);
const loggerWarnMock = vi.mocked(logger.warn);

describe(fetchGitHub, () => {
  const github = useGitHubFetch();
  const path = `/${faker.lorem.slug()}`;

  beforeEach(() => {
    loggerErrorMock.mockReset();
    loggerWarnMock.mockReset();
  });

  it('returns the response for a 2xx', async () => {
    github.respond(path, () => githubJson({}));

    expect(await fetchGitHub(path)).toEqual(
      expect.objectContaining({ ok: true }),
    );
  });

  it('returns NOT_CONFIGURED without calling GitHub when no token is set', async () => {
    github.unsetToken();

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.NOT_CONFIGURED,
    });
    expect(github.fetchMock).not.toHaveBeenCalled();
  });

  it('returns NOT_FOUND for a 404 without logging it', async () => {
    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.NOT_FOUND,
    });
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('returns RATE_LIMITED for an exhausted quota and logs it at warn', async () => {
    github.respond(
      path,
      () =>
        new Response(null, {
          status: HTTP_STATUS.FORBIDDEN,
          headers: {
            [GITHUB_RATE_LIMIT_REMAINING_HEADER]: GITHUB_RATE_LIMIT_EXHAUSTED,
          },
        }),
    );

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.RATE_LIMITED,
    });
    expect(loggerWarnMock).toHaveBeenCalledWith('github.rate_limited', {
      path,
    });
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('returns RATE_LIMITED for a 429', async () => {
    github.respond(
      path,
      () => new Response(null, { status: HTTP_STATUS.TOO_MANY_REQUESTS }),
    );

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.RATE_LIMITED,
    });
  });

  it('returns GITHUB_ERROR for a server error and logs its status', async () => {
    github.respond(
      path,
      () => new Response(null, { status: HTTP_STATUS.BAD_GATEWAY }),
    );

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.GITHUB_ERROR,
    });
    expect(loggerErrorMock).toHaveBeenCalledWith('github.request_failed', {
      path,
      responseStatus: HTTP_STATUS.BAD_GATEWAY,
    });
  });

  it('returns GITHUB_ERROR when the request itself fails', async () => {
    const thrown = new Error(faker.lorem.sentence());
    github.fetchMock.mockRejectedValue(thrown);

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      error: GITHUB_FAILURE.GITHUB_ERROR,
    });
    expect(loggerErrorMock).toHaveBeenCalledWith('github.request_error', {
      path,
      error: thrown,
    });
  });
});

describe(fetchGitHubJson, () => {
  const github = useGitHubFetch();
  const path = `/${faker.lorem.slug()}`;

  it('returns the parsed body', async () => {
    const value = faker.lorem.word();
    github.respond(path, () => githubJson({ value }));

    expect(
      await fetchGitHubJson(path, (body) => (body as { value: string }).value),
    ).toEqual({ ok: true, data: value });
  });

  it('returns GITHUB_ERROR when the body does not parse', async () => {
    github.respond(path, () => githubJson({}));

    expect(
      await fetchGitHubJson(path, () => {
        throw new Error(faker.lorem.sentence());
      }),
    ).toEqual({ ok: false, error: GITHUB_FAILURE.GITHUB_ERROR });
  });
});
