import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
  type TMaybeNull,
} from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { RELEASE_REFUSAL } from '@platform/constants/release';
import { auth } from '@platform/server/auth/auth';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { OPERATOR_ID, OPERATOR_EMAIL } from '@platform/testing/admins/operator';
import type { Session } from 'next-auth';

const {
  requireSuperAdminMock,
  getBranchHeadShaMock,
  isWorkflowRunActiveMock,
  dispatchContrastWorkflowMock,
  insertAuditEventMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  getBranchHeadShaMock: vi.fn(),
  isWorkflowRunActiveMock: vi.fn(),
  dispatchContrastWorkflowMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/github/get-branch-head-sha', () => ({
  getBranchHeadSha: getBranchHeadShaMock,
}));

vi.mock('@platform/server/github/is-workflow-run-active', () => ({
  isWorkflowRunActive: isWorkflowRunActiveMock,
}));

vi.mock('./dispatch-contrast-workflow', () => ({
  dispatchContrastWorkflow: dispatchContrastWorkflowMock,
}));

vi.mock('@blog/db', () => ({
  queries: { auditEvents: { insertAuditEvent: insertAuditEventMock } },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

describe('startContrastCheckAction', () => {
  let startContrastCheckAction: (typeof import('./start-contrast-check-action'))['startContrastCheckAction'];
  let headSha: string;

  beforeEach(async () => {
    headSha = faker.git.commitSha();
    requireSuperAdminMock
      .mockReset()
      .mockResolvedValue(makeAdmin({ role: ADMIN_ROLE.SUPERADMIN }));
    authMock.mockReset().mockResolvedValue({
      user: { id: OPERATOR_ID, email: OPERATOR_EMAIL },
    });
    getBranchHeadShaMock.mockReset().mockResolvedValue(okResult(headSha));
    isWorkflowRunActiveMock.mockReset().mockResolvedValue(okResult(false));
    dispatchContrastWorkflowMock.mockReset().mockResolvedValue(true);
    insertAuditEventMock.mockReset().mockResolvedValue({ id: 'event-1' });
    ({ startContrastCheckAction } =
      await import('./start-contrast-check-action'));
  });

  it('requires a super-admin before dispatching anything', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    await expect(startContrastCheckAction()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(dispatchContrastWorkflowMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('dispatches the workflow and records who started it against the commit', async () => {
    const result = await startContrastCheckAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchContrastWorkflowMock).toHaveBeenCalledOnce();
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: OPERATOR_ID,
      actorEmail: OPERATOR_EMAIL,
      action: AUDIT_ACTION.CONTRAST_CHECK_STARTED,
      targetType: AUDIT_TARGET_TYPE.RELEASE,
      targetId: headSha,
      details: undefined,
    });
  });

  it('refuses, dispatching and recording nothing, while a run is in progress', async () => {
    isWorkflowRunActiveMock.mockResolvedValue(okResult(true));

    const result = await startContrastCheckAction();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.CONTRAST_CHECK_RUNNING,
    });
    expect(dispatchContrastWorkflowMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('is unavailable when the head commit cannot be read', async () => {
    getBranchHeadShaMock.mockResolvedValue(errorResult('githubError'));

    const result = await startContrastCheckAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(dispatchContrastWorkflowMock).not.toHaveBeenCalled();
  });

  it('is unavailable when the active run status cannot be read', async () => {
    isWorkflowRunActiveMock.mockResolvedValue(errorResult('rateLimited'));

    const result = await startContrastCheckAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(dispatchContrastWorkflowMock).not.toHaveBeenCalled();
  });

  it('records no audit event when the dispatch fails', async () => {
    dispatchContrastWorkflowMock.mockResolvedValue(false);

    const result = await startContrastCheckAction();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('still succeeds when the audit write is lost', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection lost'));

    expect(await startContrastCheckAction()).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });
});
