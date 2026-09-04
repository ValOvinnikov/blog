import {
  FINDING_SEVERITY,
  OPERATOR_ALERT_KIND,
  type TFindingSeverity,
} from '@blog/config/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import { postOperatorAlert } from '../../lib/post-operator-alert';

type TNotifyOperatorsParams = {
  tenant: TTenant;
  invalidDocumentCount: number;
  severity: TFindingSeverity;
};

/**
 * Reports a newly-failing document-validation outcome to the platform for
 * operator notification — the caller (`validateOne`) is responsible for the
 * de-dup check via `isNewlyOpened`. Never throws: a notification failure
 * must never fail the sweep it's reporting on.
 */
export async function notifyOperatorsOfDocumentValidationFailure({
  tenant,
  invalidDocumentCount,
  severity,
}: TNotifyOperatorsParams): Promise<void> {
  await postOperatorAlert({
    kind: OPERATOR_ALERT_KIND.DOCUMENT_VALIDATION,
    tenantId: tenant.id,
    invalidDocumentCount,
    isCritical: severity === FINDING_SEVERITY.CRITICAL,
  });
}
