import { FINDING_STATUS, type TFindingKind } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import {
  listFindingsForTenant,
  resolveFinding,
} from '@shinefold/db/queries/findings';
import type { TFindingSummary } from '@shinefold/db/schema/findings';

export async function findOpenFinding(
  tenantId: string,
  findingKind: TFindingKind,
): Promise<TMaybeUndefined<TFindingSummary>> {
  const openFindings = await listFindingsForTenant(
    tenantId,
    FINDING_STATUS.OPEN,
  );
  return openFindings.find(({ kind }) => kind === findingKind);
}

export async function resolveOpenFinding(
  tenantId: string,
  findingKind: TFindingKind,
): Promise<void> {
  const finding = await findOpenFinding(tenantId, findingKind);
  if (!finding) return;

  const resolved = await resolveFinding(finding.id);
  if (!resolved.ok) {
    throw new Error(
      `Tenant "${tenantId}"'s ${findingKind} finding could not be resolved (${resolved.error}).`,
    );
  }
}
