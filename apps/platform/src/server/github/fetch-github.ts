import { HTTP_STATUS } from '@blog/config';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { logger } from '@platform/utils/logger/logger';

import { readGitHubCredentials } from './read-github-credentials';

const GITHUB_TIMEOUT_MS = 5000;

export type TGitHubFailureReason =
  'notConfigured' | 'rateLimited' | 'notFound' | 'githubError';

export type TGitHubResult<T> = TResult<T, TGitHubFailureReason>;

const isRateLimited = (response: Response): boolean =>
  response.status === 429 ||
  (response.status === HTTP_STATUS.FORBIDDEN &&
    response.headers.get('x-ratelimit-remaining') === '0');

/** Never throws; a rate limit is logged at warn and a missing resource not at all. */
export const fetchGitHub = async (
  path: string,
  accept = 'application/vnd.github+json',
): Promise<TGitHubResult<Response>> => {
  const credentials = readGitHubCredentials();

  if (!credentials) {
    logger.error('github.not_configured');
    return errorResult('notConfigured');
  }

  const { token, owner, repo } = credentials;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: accept,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      },
    );

    if (response.ok) return okResult(response);
    if (response.status === HTTP_STATUS.NOT_FOUND)
      return errorResult('notFound');

    if (isRateLimited(response)) {
      logger.warn('github.rate_limited', { path });
      return errorResult('rateLimited');
    }

    logger.error('github.request_failed', {
      path,
      responseStatus: response.status,
    });
    return errorResult('githubError');
  } catch (error) {
    logger.error('github.request_error', { path, error });
    return errorResult('githubError');
  }
};

/** A body that does not match `parse` is a `githubError`, logged once. */
export const fetchGitHubJson = async <T>(
  path: string,
  parse: (body: unknown) => T,
): Promise<TGitHubResult<T>> => {
  const result = await fetchGitHub(path);
  if (!result.ok) return result;

  try {
    return okResult(parse(await result.data.json()));
  } catch (error) {
    logger.error('github.unexpected_response', { path, error });
    return errorResult('githubError');
  }
};
