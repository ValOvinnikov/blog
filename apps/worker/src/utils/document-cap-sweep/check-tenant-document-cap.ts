import {
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
} from '@shinefold/config/constants';
import type { TValueOf } from '@shinefold/config/utils';
import { openFinding } from '@shinefold/db/queries/findings';
import { toTenantSanityCredentials } from '@shinefold/db/queries/tenants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isUndefined } from '@shinefold/utils/primitives';
import {
  DOCUMENT_CAP_CHECK,
  DOCUMENT_CAP_FINDING_IDENTIFIER,
  DOCUMENT_CAP_WARNING_RATIO,
  PLAN_DOCUMENT_CAP,
} from '@worker/constants/document-cap';
import { resolveOpenFinding } from '@worker/utils/finding/find-open-finding';

import { countTenantDocuments } from './count-tenant-documents';

export async function checkTenantDocumentCap(
  tenant: TTenant,
): Promise<TValueOf<typeof DOCUMENT_CAP_CHECK>> {
  const { id: tenantId, plan } = tenant;
  const documentCap = PLAN_DOCUMENT_CAP[plan];
  if (isUndefined(documentCap)) {
    await resolveOpenFinding(tenantId, FINDING_KIND.DOCUMENT_CAP_APPROACHING);
    return DOCUMENT_CAP_CHECK.SKIPPED;
  }

  const credentials = toTenantSanityCredentials(tenant);
  if (!credentials) return DOCUMENT_CAP_CHECK.SKIPPED;

  const documentCount = await countTenantDocuments(credentials);
  if (documentCount < documentCap * DOCUMENT_CAP_WARNING_RATIO) {
    await resolveOpenFinding(tenantId, FINDING_KIND.DOCUMENT_CAP_APPROACHING);
    return DOCUMENT_CAP_CHECK.CLEAR;
  }

  const opened = await openFinding({
    tenantId,
    source: FINDING_SOURCE.DOCUMENT_COUNT_CHECK,
    kind: FINDING_KIND.DOCUMENT_CAP_APPROACHING,
    identifier: DOCUMENT_CAP_FINDING_IDENTIFIER,
    severity: FINDING_SEVERITY.WARNING,
    details: { documentCount, documentCap },
  });
  if (!opened.ok) {
    throw new Error(
      `Tenant "${tenantId}"'s document-cap finding could not be opened (${opened.error}).`,
    );
  }
  return DOCUMENT_CAP_CHECK.NEARING;
}
