import { HTTP_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
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

  it('returns notConfigured without calling GitHub when no token is set', async () => {
    github.unsetToken();

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      reason: 'notConfigured',
    });
    expect(github.fetchMock).not.toHaveBeenCalled();
  });

  it('returns notFound for a 404 without logging it', async () => {
    expect(await fetchGitHub(path)).toEqual({ ok: false, reason: 'notFound' });
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('returns rateLimited for an exhausted quota and logs it at warn', async () => {
    github.respond(
      path,
      () =>
        new Response(null, {
          status: HTTP_STATUS.FORBIDDEN,
          headers: { 'x-ratelimit-remaining': '0' },
        }),
    );

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      reason: 'rateLimited',
    });
    expect(loggerWarnMock).toHaveBeenCalledWith('github.rate_limited', {
      path,
    });
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('returns rateLimited for a 429', async () => {
    github.respond(path, () => new Response(null, { status: 429 }));

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      reason: 'rateLimited',
    });
  });

  it('returns githubError for a server error and logs its status', async () => {
    github.respond(path, () => new Response(null, { status: 502 }));

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      reason: 'githubError',
    });
    expect(loggerErrorMock).toHaveBeenCalledWith('github.request_failed', {
      path,
      responseStatus: 502,
    });
  });

  it('returns githubError when the request itself fails', async () => {
    const thrown = new Error(faker.lorem.sentence());
    github.fetchMock.mockRejectedValue(thrown);

    expect(await fetchGitHub(path)).toEqual({
      ok: false,
      reason: 'githubError',
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

  it('returns githubError when the body does not parse', async () => {
    github.respond(path, () => githubJson({}));

    expect(
      await fetchGitHubJson(path, () => {
        throw new Error('unexpected');
      }),
    ).toEqual({ ok: false, reason: 'githubError' });
  });
});
