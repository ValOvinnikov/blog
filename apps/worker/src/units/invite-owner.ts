import { PROVISIONING_UNIT_MAX_RETRIES } from '@worker/constants/provisioning';
import { FatalError } from 'workflow';

import { loadTenant, type TUnitResult } from './run-reported-step';

export async function inviteOwner(tenantId: string): Promise<TUnitResult> {
  'use step';

  const { sanityProjectId } = await loadTenant(tenantId);
  if (!sanityProjectId) {
    throw new FatalError(
      `Tenant "${tenantId}" has no Sanity project to invite its owner to.`,
    );
  }
  return { ok: true };
}

inviteOwner.maxRetries = PROVISIONING_UNIT_MAX_RETRIES;
