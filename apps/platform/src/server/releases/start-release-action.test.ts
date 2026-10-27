import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
  RELEASE_CHANGE,
  type TMaybeNull,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { GITHUB_FAILURE } from '@platform/constants/github';
import {
  CONTRAST_STATUS,
  RELEASE_FAILURE,
  RELEASE_FIELD_ERROR,
  RELEASE_REFUSAL,
  RELEASE_RUN_STATUS,
} from '@platform/constants/release';
import { auth } from '@platform/server/auth/auth';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  MOCK_OPERATOR_EMAIL,
  MOCK_OPERATOR_ID,
} from '@platform/testing/admins/operator';
import {
  MOCK_RELEASE_LAST_TAG,
  mockReleaseRun,
} from '@platform/testing/releases/fixtures';
import type { Session } from 'next-auth';

import { startReleaseAction } from './start-release-action';

faker.seed(5998);

const {
  getCandidateComparisonMock,
  getReleaseRunMock,
  resolveContrastStatusMock,
  dispatchReleaseWorkflowMock,
  insertAuditEventMock,
  releaseSwitch,
} = vi.hoisted(() => ({
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

vi.mock('@platform/server/auth/require-super-admin');

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

const MOCK_NEXT_VERSION = 'v1.5.0';
const MOCK_OVERRIDE_REASON = faker.lorem.sentence();

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const candidate = (isRenderingChanged: boolean, headSha: string) =>
  okResult({
    headSha,
    lastTag: MOCK_RELEASE_LAST_TAG,
    changes: {
      [RELEASE_CHANGE.RENDERING]: isRenderingChanged,
      [RELEASE_CHANGE.DB_MIGRATION]: false,
      [RELEASE_CHANGE.SANITY_MIGRATION]: false,
      [RELEASE_CHANGE.ENV]: false,
    },
  });

describe(startReleaseAction, () => {
  let headSha: string;

  beforeEach(() => {
    headSha = faker.git.commitSha();
    releaseSwitch.isEnabled = true;
    authMock.mockReset().mockResolvedValue({
      user: { id: MOCK_OPERATOR_ID, email: MOCK_OPERATOR_EMAIL },
    });
    getCandidateComparisonMock
      .mockReset()
      .mockResolvedValue(candidate(false, headSha));
    getReleaseRunMock.mockReset().mockResolvedValue(okResult(mockReleaseRun()));
    resolveContrastStatusMock
      .mockReset()
      .mockResolvedValue(okResult(CONTRAST_STATUS.NONE));
    dispatchReleaseWorkflowMock.mockReset().mockResolvedValue(true);
    insertAuditEventMock.mockReset();
  });

  const overrideNeeded = () => {
    getCandidateComparisonMock.mockResolvedValue(candidate(true, headSha));
    resolveContrastStatusMock.mockResolvedValue(okResult(CONTRAST_STATUS.DUE));
  };

  it('requires a super-admin before reading or dispatching anything', async () => {
    vi.mocked(requireSuperAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(
      startReleaseAction({ version: MOCK_NEXT_VERSION }),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getCandidateComparisonMock).not.toHaveBeenCalled();
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
  });

  it('refuses while production releases are paused, touching nothing', async () => {
    releaseSwitch.isEnabled = false;

    const result = await startReleaseAction({ version: MOCK_NEXT_VERSION });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: RELEASE_REFUSAL.RELEASES_PAUSED,
    });
    expect(getCandidateComparisonMock).not.toHaveBeenCalled();
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('dispatches the release without an override and records who started it', async () => {
    const result = await startReleaseAction({
      version: ` ${MOCK_NEXT_VERSION} `,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchReleaseWorkflowMock).toHaveBeenCalledWith({
      version: MOCK_NEXT_VERSION,
      isOverride: false,
    });
    expect(insertAuditEventMock).toHaveBeenCalledOnce();
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.RELEASE_STARTED,
      targetType: AUDIT_TARGET_TYPE.RELEASE,
      targetId: MOCK_NEXT_VERSION,
      details: { headSha, isOverride: false },
    });
  });

  it('releases a passing candidate without an override when rendering changed', async () => {
    getCandidateComparisonMock.mockResolvedValue(candidate(true, headSha));
    resolveContrastStatusMock.mockResolvedValue(
      okResult(CONTRAST_STATUS.GREEN),
    );

    const result = await startReleaseAction({ version: MOCK_NEXT_VERSION });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchReleaseWorkflowMock).toHaveBeenCalledWith({
      version: MOCK_NEXT_VERSION,
      isOverride: false,
    });
  });

  it('dispatches an override and stores the reason with the actor', async () => {
    overrideNeeded();

    const result = await startReleaseAction({
      version: MOCK_NEXT_VERSION,
      overrideReason: MOCK_OVERRIDE_REASON,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(dispatchReleaseWorkflowMock).toHaveBeenCalledWith({
      version: MOCK_NEXT_VERSION,
      isOverride: true,
    });
    expect(insertAuditEventMock).toHaveBeenCalledWith({
      actorId: MOCK_OPERATOR_ID,
      action: AUDIT_ACTION.RELEASE_OVERRIDE,
      targetType: AUDIT_TARGET_TYPE.RELEASE,
      targetId: MOCK_NEXT_VERSION,
      details: {
        headSha,
        contrastStatus: CONTRAST_STATUS.DUE,
        reason: MOCK_OVERRIDE_REASON,
      },
    });
  });

  it.each([undefined, '   '])(
    'refuses an override with reason %j, dispatching nothing',
    async (overrideReason) => {
      overrideNeeded();

      const result = await startReleaseAction({
        version: MOCK_NEXT_VERSION,
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
    [MOCK_RELEASE_LAST_TAG, RELEASE_FIELD_ERROR.VERSION_NOT_GREATER],
    ['v1.3.9', RELEASE_FIELD_ERROR.VERSION_NOT_GREATER],
  ])('refuses version %s naming the last tag', async (version, reason) => {
    const result = await startReleaseAction({ version });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        version: { reason, values: { lastTag: MOCK_RELEASE_LAST_TAG } },
      },
    });
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
  });

  it.each([RELEASE_RUN_STATUS.DISPATCHED, RELEASE_RUN_STATUS.RUNNING])(
    'refuses a second release while one is %s',
    async (status) => {
      getReleaseRunMock.mockResolvedValue(okResult(mockReleaseRun({ status })));

      const result = await startReleaseAction({ version: MOCK_NEXT_VERSION });

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

    const result = await startReleaseAction({ version: MOCK_NEXT_VERSION });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
  });

  it('is unavailable when the contrast status cannot be read', async () => {
    resolveContrastStatusMock.mockResolvedValue(
      errorResult(RELEASE_FAILURE.DB_ERROR),
    );

    const result = await startReleaseAction({ version: MOCK_NEXT_VERSION });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.UNAVAILABLE });
    expect(dispatchReleaseWorkflowMock).not.toHaveBeenCalled();
  });

  it('records nothing when the dispatch fails', async () => {
    overrideNeeded();
    dispatchReleaseWorkflowMock.mockResolvedValue(false);

    const result = await startReleaseAction({
      version: MOCK_NEXT_VERSION,
      overrideReason: MOCK_OVERRIDE_REASON,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(insertAuditEventMock).not.toHaveBeenCalled();
  });

  it('still succeeds when the audit write is lost', async () => {
    insertAuditEventMock.mockRejectedValue(new Error(faker.lorem.sentence()));

    const result = await startReleaseAction({ version: MOCK_NEXT_VERSION });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });
});
