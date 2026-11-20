import { type TContrastStatus, RELEASE_LOG } from '@platform/constants/release';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  type TMaybeUndefined,
} from '@shinefold/config';

import { dispatchReleaseWorkflow } from './dispatch-release-workflow';

type TDispatchAuditedReleaseInput = {
  version: string;
  headSha: string;
  isOverride: boolean;
  contrastStatus: TContrastStatus;
  overrideReason: TMaybeUndefined<string>;
};

/** The audit events attest the dispatch request, not the workflow's outcome. */
export const dispatchAuditedRelease = async ({
  version,
  headSha,
  isOverride,
  contrastStatus,
  overrideReason,
}: TDispatchAuditedReleaseInput): Promise<boolean> => {
  const isDispatched = await dispatchReleaseWorkflow({
    version,
    headSha,
    isOverride,
  });
  if (!isDispatched) return false;

  await recordAuditEvent({
    logEvent: RELEASE_LOG.RELEASE_AUDIT_FAILED,
    action: AUDIT_ACTION.RELEASE_STARTED,
    targetType: AUDIT_TARGET_TYPE.RELEASE,
    targetId: version,
    details: { headSha, isOverride },
  });
  if (isOverride) {
    await recordAuditEvent({
      logEvent: RELEASE_LOG.RELEASE_OVERRIDE_AUDIT_FAILED,
      action: AUDIT_ACTION.RELEASE_OVERRIDE,
      targetType: AUDIT_TARGET_TYPE.RELEASE,
      targetId: version,
      details: { headSha, contrastStatus, reason: overrideReason },
    });
  }
  return true;
};
