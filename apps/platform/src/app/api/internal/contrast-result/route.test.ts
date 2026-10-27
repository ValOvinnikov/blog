import {
  CONTRAST_CHECK_OUTCOME,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { CONTRAST_RESULT_LOG } from '@platform/constants/contrast-result';
import { MOCK_BEARER_SECRET } from '@platform/testing/internal-api/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

import { POST } from './route';

faker.seed(5997);

const { recordContrastResultMock } = vi.hoisted(() => ({
  recordContrastResultMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    findings: { recordContrastResult: recordContrastResultMock },
  },
}));

const envMock: Partial<Record<keyof typeof env, string>> = env;
const loggerErrorMock = vi.mocked(logger.error);

const MOCK_ENDPOINT = faker.internet.url();
const MOCK_WRONG_SECRET = faker.string.alphanumeric(24);
const MOCK_SHA = faker.git.commitSha();
const MOCK_RECORD_ERROR = new Error(faker.lorem.sentence());

const MOCK_FAILING_BODY = {
  sha: MOCK_SHA,
  outcome: CONTRAST_CHECK_OUTCOME.FAIL,
  failureCount: 3,
  runUrl: faker.internet.url(),
};

const MOCK_PASSING_BODY = {
  ...MOCK_FAILING_BODY,
  outcome: CONTRAST_CHECK_OUTCOME.PASS,
  failureCount: 0,
  tag: faker.system.semver(),
};

const postRawRequest = (
  rawBody: string,
  authorization = `Bearer ${MOCK_BEARER_SECRET}`,
): Request =>
  new Request(MOCK_ENDPOINT, {
    method: HTTP_METHOD.POST,
    headers: { authorization },
    body: rawBody,
  });

const postRequest = (body: unknown, authorization?: string): Request =>
  postRawRequest(JSON.stringify(body), authorization);

describe(POST, () => {
  beforeEach(() => {
    envMock.CONTRAST_RESULT_SECRET = MOCK_BEARER_SECRET;
  });

  it('rejects a request with the wrong secret', async () => {
    const response = await POST(
      postRequest(MOCK_FAILING_BODY, `Bearer ${MOCK_WRONG_SECRET}`),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(recordContrastResultMock).not.toHaveBeenCalled();
  });

  it('logs and returns 500 when the secret is not configured', async () => {
    envMock.CONTRAST_RESULT_SECRET = undefined;

    const response = await POST(postRequest(MOCK_FAILING_BODY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      CONTRAST_RESULT_LOG.SECRET_MISSING,
    );
    expect(recordContrastResultMock).not.toHaveBeenCalled();
  });

  it.each([
    ['a body that is not valid JSON', '{not valid json'],
    [
      'an unknown outcome',
      JSON.stringify({ ...MOCK_FAILING_BODY, outcome: faker.lorem.word() }),
    ],
    [
      'a SHA that is not a full commit hash',
      JSON.stringify({ ...MOCK_FAILING_BODY, sha: MOCK_SHA.slice(0, 7) }),
    ],
    [
      'a negative failure count',
      JSON.stringify({ ...MOCK_FAILING_BODY, failureCount: -1 }),
    ],
    [
      'a run URL that is not a URL',
      JSON.stringify({ ...MOCK_FAILING_BODY, runUrl: faker.lorem.words() }),
    ],
  ])('returns 400 for %s', async (_label, rawBody) => {
    const response = await POST(postRawRequest(rawBody));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(recordContrastResultMock).not.toHaveBeenCalled();
  });

  it.each([
    ['failing result', MOCK_FAILING_BODY],
    ['passing result with its tag', MOCK_PASSING_BODY],
  ])('records a valid %s', async (_label, body) => {
    const response = await POST(postRequest(body));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(recordContrastResultMock).toHaveBeenCalledWith(body);
  });

  it('logs and returns 500 when recording fails', async () => {
    recordContrastResultMock.mockRejectedValueOnce(MOCK_RECORD_ERROR);

    const response = await POST(postRequest(MOCK_FAILING_BODY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      CONTRAST_RESULT_LOG.RECORD_FAILED,
      {
        sha: MOCK_SHA,
        outcome: CONTRAST_CHECK_OUTCOME.FAIL,
        errorName: MOCK_RECORD_ERROR.name,
      },
    );
  });
});
