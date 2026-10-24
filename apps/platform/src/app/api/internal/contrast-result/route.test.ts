import {
  CONTRAST_CHECK_OUTCOME,
  HTTP_METHOD,
  HTTP_STATUS,
} from '@blog/config/constants';
import { CONTRAST_RESULT_LOG } from '@platform/constants/contrast-result';
import { MOCK_BEARER_SECRET } from '@platform/testing/internal-api/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { env } from '@platform/utils/env/env';
import { logger } from '@platform/utils/logger/logger';

const { recordContrastResultMock } = vi.hoisted(() => ({
  recordContrastResultMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

const envMock: Partial<Record<keyof typeof env, string>> = env;

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    findings: { recordContrastResult: recordContrastResultMock },
  },
}));

const loggerErrorMock = vi.mocked(logger.error);

const ENDPOINT = 'https://admin.example.com/api/internal/contrast-result';
const SHA = 'a'.repeat(40);

const VALID_BODY = {
  sha: SHA,
  outcome: CONTRAST_CHECK_OUTCOME.FAIL,
  failureCount: 3,
  runUrl: 'https://github.com/owner/repo/actions/runs/1',
};

const postRequest = (
  body: unknown,
  { authorization }: { authorization?: string } = {
    authorization: `Bearer ${MOCK_BEARER_SECRET}`,
  },
): Request =>
  new Request(ENDPOINT, {
    method: HTTP_METHOD.POST,
    headers: authorization ? { authorization } : {},
    body: JSON.stringify(body),
  });

describe('POST /api/internal/contrast-result', () => {
  let POST: typeof import('./route').POST;

  beforeEach(async () => {
    envMock.CONTRAST_RESULT_SECRET = MOCK_BEARER_SECRET;
    recordContrastResultMock.mockReset().mockResolvedValue({ id: 'f1' });
    loggerErrorMock.mockReset();
    ({ POST } = await import('./route'));
  });

  it('rejects a request with the wrong secret', async () => {
    const response = await POST(
      postRequest(VALID_BODY, { authorization: 'Bearer wrong-secret-value' }),
    );

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(recordContrastResultMock).not.toHaveBeenCalled();
  });

  it('returns 500 and records nothing when the secret is not configured', async () => {
    envMock.CONTRAST_RESULT_SECRET = undefined;

    const response = await POST(postRequest(VALID_BODY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      CONTRAST_RESULT_LOG.SECRET_MISSING,
    );
    expect(recordContrastResultMock).not.toHaveBeenCalled();
  });

  it('returns 400 for a body that is not valid JSON', async () => {
    const request = new Request(ENDPOINT, {
      method: HTTP_METHOD.POST,
      headers: { authorization: `Bearer ${MOCK_BEARER_SECRET}` },
      body: '{not valid json',
    });

    const response = await POST(request);

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(recordContrastResultMock).not.toHaveBeenCalled();
  });

  it.each([
    ['an unknown outcome', { ...VALID_BODY, outcome: 'MAYBE' }],
    ['a SHA that is not a full commit hash', { ...VALID_BODY, sha: 'abc123' }],
    ['a negative failure count', { ...VALID_BODY, failureCount: -1 }],
    ['a run URL that is not a URL', { ...VALID_BODY, runUrl: 'not a url' }],
  ])('returns 400 for %s', async (_label, body) => {
    const response = await POST(postRequest(body));

    expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(recordContrastResultMock).not.toHaveBeenCalled();
  });

  it('records a valid failing result', async () => {
    const response = await POST(postRequest(VALID_BODY));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(recordContrastResultMock).toHaveBeenCalledWith(VALID_BODY);
  });

  it('records a valid passing result with its tag', async () => {
    const body = {
      ...VALID_BODY,
      outcome: CONTRAST_CHECK_OUTCOME.PASS,
      failureCount: 0,
      tag: 'v1.2.3',
    };

    const response = await POST(postRequest(body));

    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(recordContrastResultMock).toHaveBeenCalledWith(body);
  });

  it('logs and returns 500 when recording fails', async () => {
    const error = new Error('connection refused');
    recordContrastResultMock.mockRejectedValue(error);

    const response = await POST(postRequest(VALID_BODY));

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      CONTRAST_RESULT_LOG.RECORD_FAILED,
      { sha: SHA, outcome: CONTRAST_CHECK_OUTCOME.FAIL, error },
    );
  });
});
