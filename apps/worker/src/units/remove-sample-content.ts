import type { SanityDocument } from '@sanity/client';
import { STARTER_DOCUMENT_ID_PREFIX } from '@shinefold/config/constants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { hasArrayGotItems } from '@shinefold/utils/primitives';
import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { SAMPLE_CONTENT_LOG } from '@worker/constants/sample-content';
import { logger } from '@worker/utils/logger/logger';
import { planSampleContentRemoval } from '@worker/utils/sample-content/plan-sample-content-removal';
import { createTenantWriteClient } from '@worker/utils/tenant-content/tenant-write-client';

import { isFinalStepAttempt } from './run-reported-step';

export type TRemoveSampleContentResult = {
  removed: string[];
  keptEdited: string[];
  keptReferenced: string[];
};

const STARTER_DOCUMENTS_QUERY = `*[_id in path("${STARTER_DOCUMENT_ID_PREFIX}**")]`;
const PENDING_STARTER_IDS_QUERY = `*[_id in path("drafts.${STARTER_DOCUMENT_ID_PREFIX}**") || _id in path("versions.*.${STARTER_DOCUMENT_ID_PREFIX}**")]._id`;
// Whole documents: a reference can sit in any field, and the planner walks them all.
const REFERRERS_QUERY = '*[references($ids) && !(_id in $ids)]';

export async function removeSampleContent(
  tenantId: string,
): Promise<TRemoveSampleContentResult> {
  'use step';

  try {
    const client = await createTenantWriteClient(tenantId);
    const [starterDocuments, pendingIds] = await Promise.all([
      client.fetch<SanityDocument[]>(STARTER_DOCUMENTS_QUERY),
      client.fetch<string[]>(PENDING_STARTER_IDS_QUERY),
    ]);
    const referrers = await client.fetch<SanityDocument[]>(REFERRERS_QUERY, {
      ids: starterDocuments.map(({ _id }) => _id),
    });
    const { removals, unlinks, keptEdited, keptReferenced } =
      planSampleContentRemoval({ starterDocuments, pendingIds, referrers });

    if (hasArrayGotItems(removals)) {
      const transaction = client.transaction();
      for (const { documentId, revision, field, keys } of unlinks) {
        transaction.patch(documentId, {
          ifRevisionID: revision,
          unset: keys.map((key) => `${field}[_key=="${key}"]`),
        });
      }
      for (const { documentId, revision } of removals) {
        transaction.patch(documentId, { ifRevisionID: revision });
        transaction.delete(documentId);
      }
      await transaction.commit();
    }

    return {
      removed: removals.map(({ documentId }) => documentId),
      keptEdited,
      keptReferenced,
    };
  } catch (error) {
    if (isFinalStepAttempt(error)) {
      logger.error(SAMPLE_CONTENT_LOG.REMOVAL_FAILED, {
        tenantId,
        error: sanitizeLogMessage(error),
      });
    }
    throw error;
  }
}

removeSampleContent.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
