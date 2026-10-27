import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  HTTP_STATUS,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import { GITHUB_RUN_STATUS } from '@platform/constants/github';
import { RELEASE_REFUSAL } from '@platform/constants/release';
import { auth } from '@platform/server/auth/auth';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import {
  MOCK_GITHUB_CONTRAST_DISPATCH_PATH,
  MOCK_GITHUB_CONTRAST_RUNS_PATH,
  MOCK_GITHUB_MAIN_BRANCH_PATH,
} from '@platform/testing/github/fixtures';
import {
  mockGitHubResponse,
  useGitHubFetch,
} from '@platform/testing/github/github-fetch';
import type { Session } from 'next-auth';

import { startContrastCheckAction } from './start-contrast-check-action';

faker.seed(5998);

const { insertAuditEventMock } = vi.hoisted(() => ({
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', () => ({
  queries: { auditEvents: { insertAuditEvent: insertAuditEventMock } },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

describe(startContrastCheckAction, () => {
  const github = useGitHubFetch();
  let headSha: string;

  const isDispatched = () =>
    github.fetchMock.mock.calls.some(([url]) =>
      String(url).endsWith(MOCK_GITHUB_CONTRAST_DISPATCH_PATH),
    );

  beforeEach(() => {
    headSha = faker.git.commitSha();
    authMock.mockReset().mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    github.respond(MOCK_GITHUB_MAIN_BRANCH_PATH, () =>
      mockGitHubResponse({ commit: { sha: headSha } }),
    );
    github.respond(MOCK_GITHUB_CONTRAST_RUNS_PATH, () =>
      mockGitHubResponse({ workflow_runs: [] }),
    );
    github.respond(
      MOCK_GITHUB_CONTRAST_DISPATCH_PATH,
      () => new Response(null, { status: HTTP_STATUS.NO_CONTENT }),
    );
    insertAuditEventMock.mockReset();
  });

  it('requires a super-admin before dispatching anything', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(startContrastCheckAction()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(isDispatched()).toBe(false);
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('dispatches the workflow and records who started it against the commit', async () => {
    const result = await startContrastCheckAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(isDispatched()).toBe(true);
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.CONTRAST_CHECK_STARTED,
      targetType: AUDIT_TARGET_TYPE.RELEASE,
      targetId: headSha,
      details: undefined,
    });
  });

  it('refuses, dispatching and recording nothing, while a run is in progress', async () => {
    github.respond(MOCK_GITHUB_CONTRAST_RUNS_PATH, () =>
      mockGitHubResponse({
        workflow_runs: [{ status: GITHUB_RUN_STATUS.IN_PROGRESS }],
      }),
    );

    const result = await startContrastCheckAction();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.CONTRAST_CHECK_RUNNING,
    });
    expect(isDispatched()).toBe(false);
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('is unavailable when the head commit cannot be read', async () => {
    github.respond(MOCK_GITHUB_MAIN_BRANCH_PATH, () =>
      mockGitHubResponse({}, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    const result = await startContrastCheckAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(isDispatched()).toBe(false);
  });

  it('is unavailable when the active run status cannot be read', async () => {
    github.respond(MOCK_GITHUB_CONTRAST_RUNS_PATH, () =>
      mockGitHubResponse({}, HTTP_STATUS.TOO_MANY_REQUESTS),
    );

    const result = await startContrastCheckAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(isDispatched()).toBe(false);
  });

  it('records no audit event when the dispatch fails', async () => {
    github.respond(MOCK_GITHUB_CONTRAST_DISPATCH_PATH, () =>
      mockGitHubResponse({}, HTTP_STATUS.INTERNAL_SERVER_ERROR),
    );

    const result = await startContrastCheckAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('still succeeds when the audit write is lost', async () => {
    insertAuditEventMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    expect(await startContrastCheckAction()).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });
});
