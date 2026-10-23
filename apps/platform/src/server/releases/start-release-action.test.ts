import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
  RELEASE_CHANGE,
  type TMaybeNull,
} from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { GITHUB_FAILURE } from '@platform/constants/github';
import {
  CONTRAST_STATUS,
  RELEASE_FIELD_ERROR,
  RELEASE_REFUSAL,
  RELEASE_RUN_STATUS,
  RELEASE_FAILURE,
} from '@platform/constants/release';
import { auth } from '@platform/server/auth/auth';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { OPERATOR_ID, OPERATOR_EMAIL } from '@platform/testing/admins/operator';
import { makeReleaseRun } from '@platform/testing/releases/fixtures';
import type { Session } from 'next-auth';

const {
  requireSuperAdminMock,
  getCandidateComparisonMock,
  getReleaseRunMock,
  resolveContrastStatusMock,
  dispatchReleaseWorkflowMock,
  insertAuditEventMock,
  releaseSwitch,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  getCandidateComparisonMock: vi.fn(),
  getReleaseRunMock: vi.fn(),
  resolveContrastStatusMock: vi.fn(),
  dispatchReleaseWorkflowMock: vi.fn(),
  insertAuditEventMock: vi.fn(),
  releaseSwitch: { isEnabled: true },
}));

vi.mock('@platform/constants/release', async (importOriginal) => ({
  ...(await importOriginal()),
  get IS_PRODUCTION_RELEASE_ENABLED() {
    return releaseSwitch.isEnabled;
  },
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/auth/auth');

vi.mock('./get-candidate-comparison', () => ({
  getCandidateComparison: getCandidateComparisonMock,
}));

vi.mock('./get-release-run', () => ({ getReleaseRun: getReleaseRunMock }));

vi.mock('./resolve-contrast-status', () => ({
  resolveContrastStatus: resolveContrastStatusMock,
}));

vi.mock('./dispatch-release-workflow', () => ({
  dispatchReleaseWorkflow: dispatchReleaseWorkflowMock,
}));

vi.mock('@blog/db', () => ({
  queries: { auditEvents: { insertAuditEvent: insertAuditEventMock } },
}));

const OVERRIDE_REASON = 'Hotfix for a broken checkout';

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const candidate = (isRenderingChanged: boolean, headSha: string) =>
  okResult({
    headSha,
    lastTag: 'v1.4.0',
    changes: {
      [RELEASE_CHANGE.RENDERING]: isRenderingChanged,
      [RELEASE_CHANGE.DB_MIGRATION]: false,
      [RELEASE_CHANGE.SANITY_MIGRATION]: false,
      [RELEASE_CHANGE.ENV]: false,
    },
  });

describe('startReleaseAction', () => {
  let startReleaseAction: (typeof import('./start-release-action'))['startReleaseAction'];
  let headSha: string;

  beforeEach(async () => {
    headSha = faker.git.commitSha();
    releaseSwitch.isEnabled = true;
    requireSuperAdminMock
      .mockReset()
      .mockResolvedValue(makeAdmin({ role: ADMIN_ROLE.SUPERADMIN }));
    authMock.mockReset().mockResolvedValue({
      user: { id: OPERATOR_ID, email: OPERATOR_EMAIL },
    });
    getCandidateComparisonMock
      .mockReset()
      .mockResolvedValue(candidate(false, headSha));
    getReleaseRunMock.mockReset().mockResolvedValue(okResult(makeReleaseRun()));
    resolveContrastStatusMock
      .mockReset()
      .mockResolvedValue(okResult(CONTRAST_STATUS.NONE));
    dispatchReleaseWorkflowMock.mockReset().mockResolvedValue(true);
    insertAuditEventMock.mockReset().mockResolvedValue({ id: 'event-1' });
    ({ startReleaseAction } = await import('./start-release-action'));
  });

  const overrideNeeded = () => {
    getCandidateComparisonMock.mockResolvedValue(candidate(true, headSha));
    resolveContrastStatusMock.mockResolvedValue(okResult(CONTRAST_STATUS.DUE));
  };

  it('requires a super-admin before reading or dispatching anything', async () => {
    requireSuperAdminMock.mockRejectedValue(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(startReleaseAction({ version: 'v1.5.0' })).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getCandidateComparisonMock).not.toHaveBeenCalled();
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
  });

  it('refuses while production releases are paused, reading, dispatching and recording nothing', async () => {
    releaseSwitch.isEnabled = false;

    const result = await startReleaseAction({ version: 'v1.5.0' });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.RELEASES_PAUSED,
    });
    expect(getCandidateComparisonMock).not.toHaveBeenCalled();
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('dispatches the release without an override and records who started it', async () => {
    const result = await startReleaseAction({ version: ' v1.5.0 ' });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchReleaseWorkflowMock).toHaveBeenCalledWith({
      version: 'v1.5.0',
      isOverride: false,
    });
    expect(insertAuditEventMock).toHaveBeenCalledOnce();
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: OPERATOR_ID,
      actorEmail: OPERATOR_EMAIL,
      action: AUDIT_ACTION.RELEASE_STARTED,
      targetType: AUDIT_TARGET_TYPE.RELEASE,
      targetId: 'v1.5.0',
      details: { headSha, isOverride: false },
    });
  });

  it('releases a passing candidate without an override even when rendering changed', async () => {
    getCandidateComparisonMock.mockResolvedValue(candidate(true, headSha));
    resolveContrastStatusMock.mockResolvedValue(
      okResult(CONTRAST_STATUS.GREEN),
    );

    expect(await startReleaseAction({ version: 'v1.5.0' })).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    expect(dispatchReleaseWorkflowMock).toHaveBeenCalledWith({
      version: 'v1.5.0',
      isOverride: false,
    });
  });

  it('dispatches an override and stores the reason with the actor', async () => {
    overrideNeeded();

    const result = await startReleaseAction({
      version: 'v1.5.0',
      overrideReason: OVERRIDE_REASON,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchReleaseWorkflowMock).toHaveBeenCalledWith({
      version: 'v1.5.0',
      isOverride: true,
    });
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: OPERATOR_ID,
      actorEmail: OPERATOR_EMAIL,
      action: AUDIT_ACTION.RELEASE_OVERRIDE,
      targetType: AUDIT_TARGET_TYPE.RELEASE,
      targetId: 'v1.5.0',
      details: {
        headSha,
        contrastStatus: CONTRAST_STATUS.DUE,
        reason: OVERRIDE_REASON,
      },
    });
  });

  it.each([undefined, '   '])(
    'refuses an override with reason %j, dispatching nothing',
    async (overrideReason) => {
      overrideNeeded();

      const result = await startReleaseAction({
        version: 'v1.5.0',
        overrideReason,
      });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.INVALID,
        fieldErrors: {
          overrideReason: { reason: RELEASE_FIELD_ERROR.REASON_REQUIRED },
        },
      });
      expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
      expect(insertAuditEventMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['1.5.0', RELEASE_FIELD_ERROR.VERSION_MALFORMED],
    ['v1.5', RELEASE_FIELD_ERROR.VERSION_MALFORMED],
    ['v1.4.0', RELEASE_FIELD_ERROR.VERSION_NOT_GREATER],
    ['v1.3.9', RELEASE_FIELD_ERROR.VERSION_NOT_GREATER],
  ])('refuses version %s naming the last tag', async (version, reason) => {
    const result = await startReleaseAction({ version });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { version: { reason, values: { lastTag: 'v1.4.0' } } },
    });
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
  });

  it.each([RELEASE_RUN_STATUS.DISPATCHED, RELEASE_RUN_STATUS.RUNNING])(
    'refuses a second release while one is %s',
    async (status) => {
      getReleaseRunMock.mockResolvedValue(okResult(makeReleaseRun({ status })));

      const result = await startReleaseAction({ version: 'v1.5.0' });

      expect(result).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: RELEASE_REFUSAL.RELEASE_RUNNING,
      });
      expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
    },
  );

  it('is unavailable when the candidate cannot be read', async () => {
    getCandidateComparisonMock.mockResolvedValue(
      errorResult(GITHUB_FAILURE.RATE_LIMITED),
    );

    expect(await startReleaseAction({ version: 'v1.5.0' })).toEqual({
      outcome: ACTION_OUTCOME.UNAVAILABLE,
    });
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
  });

  it('is unavailable when the contrast status cannot be read', async () => {
    resolveContrastStatusMock.mockResolvedValue(
      errorResult(RELEASE_FAILURE.DB_ERROR),
    );

    expect(await startReleaseAction({ version: 'v1.5.0' })).toEqual({
      outcome: ACTION_OUTCOME.UNAVAILABLE,
    });
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
  });

  it('records nothing when the dispatch fails', async () => {
    overrideNeeded();
    dispatchReleaseWorkflowMock.mockResolvedValue(false);

    const result = await startReleaseAction({
      version: 'v1.5.0',
      overrideReason: 'Hotfix',
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('still succeeds when the audit write is lost', async () => {
    insertAuditEventMock.mockRejectedValue(new Error('connection lost'));

    expect(await startReleaseAction({ version: 'v1.5.0' })).toEqual({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });
});
