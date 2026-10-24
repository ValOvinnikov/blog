'use server';

import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TActionResult,
} from '@blog/config';
import { toOutcome } from '@blog/utils/to-outcome';
import {
  CONTRAST_WORKFLOW_FILE,
  RELEASE_REFUSAL,
  RELEASE_LOG,
} from '@platform/constants/release';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { getBranchHeadSha } from '@platform/server/github/get-branch-head-sha';
import { isWorkflowRunActive } from '@platform/server/github/is-workflow-run-active';

import { dispatchContrastWorkflow } from './dispatch-contrast-workflow';

export type TStartContrastCheckResult = TActionResult<
  | typeof ACTION_OUTCOME.REFUSED
  | typeof ACTION_OUTCOME.UNAVAILABLE
  | typeof ACTION_OUTCOME.SERVER_ERROR,
  never,
  never,
  typeof RELEASE_REFUSAL.CONTRAST_CHECK_RUNNING
>;

/** The audit event attests the dispatch request, not the workflow's outcome. */
export const startContrastCheckAction =
  async (): Promise<TStartContrastCheckResult> => {
    await requireSuperAdmin();

    const headSha = await getBranchHeadSha();
    if (!headSha.ok) return toOutcome(ACTION_OUTCOME.UNAVAILABLE);

    const active = await isWorkflowRunActive(
      CONTRAST_WORKFLOW_FILE,
      headSha.data,
    );
    if (!active.ok) return toOutcome(ACTION_OUTCOME.UNAVAILABLE);
    if (active.data) {
      return {
        outcome: ACTION_OUTCOME.REFUSED,
        reason: RELEASE_REFUSAL.CONTRAST_CHECK_RUNNING,
      };
    }

    const isDispatched = await dispatchContrastWorkflow();
    if (!isDispatched) return toOutcome(ACTION_OUTCOME.SERVER_ERROR);

    await recordAuditEvent({
      logEvent: RELEASE_LOG.CONTRAST_CHECK_AUDIT_FAILED,
      action: AUDIT_ACTION.CONTRAST_CHECK_STARTED,
      targetType: AUDIT_TARGET_TYPE.RELEASE,
      targetId: headSha.data,
    });

    return toOutcome(ACTION_OUTCOME.SUCCESS);
  };
