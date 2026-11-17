import {
  HTTP_STATUS,
  type TMaybeNull,
  type TMaybeUndefined,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTakeawayGenerationClaim } from '@shinefold/db/queries/takeaway-generations/claim-takeaway-generation';
import type { TTenantSanityContext } from '@shinefold/service';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { skimResponse } from '@web/server/skim/skim-response/skim-response';
import { getHostTenantSanityWriteContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import type { NextResponse } from 'next/server';

export const UNRESOLVED_TENANT_MESSAGE =
  'Failed to resolve the requesting tenant.';

type TSkimWriteGate =
  | {
      isAllowed: true;
      tenant: TMaybeUndefined<TTenantSanityContext>;
      claim: TMaybeNull<TTakeawayGenerationClaim>;
    }
  | { isAllowed: false; response: NextResponse };

const refuse = (message: string, status: number): TSkimWriteGate => ({
  isAllowed: false,
  response: skimResponse(message, status),
});

const refuseInactive = (): TSkimWriteGate =>
  refuse(
    'The requesting tenant is not permitted to write.',
    HTTP_STATUS.FORBIDDEN,
  );

export const gateSkimWrite = async (
  postId: string,
): Promise<TSkimWriteGate> => {
  const writeTenant = await getHostTenantSanityWriteContext();
  if (!writeTenant.isResolvable) {
    logger.error(GENERATE_SKIM_LOG.WRITE_TENANT_UNRESOLVABLE, { postId });
    return refuse(UNRESOLVED_TENANT_MESSAGE, HTTP_STATUS.NOT_FOUND);
  }

  const { tenant, tenantId, isActive } = writeTenant;
  if (!tenantId) {
    return { isAllowed: true, tenant, claim: null };
  }
  if (!tenant) {
    logger.error(GENERATE_SKIM_LOG.TENANT_WRITE_CREDENTIALS_MISSING, {
      postId,
      tenantId,
    });
    return refuse(
      'The requesting tenant has no usable Sanity write credentials.',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }
  if (!isActive) {
    logger.warn(GENERATE_SKIM_LOG.TENANT_NOT_ACTIVE, { postId, tenantId });
    return refuseInactive();
  }

  let claim: TMaybeNull<TTakeawayGenerationClaim>;
  try {
    claim = await queries.takeawayGenerations.claimTakeawayGeneration(tenantId);
  } catch (error) {
    logger.error(GENERATE_SKIM_LOG.CLAIM_FAILED, { postId, tenantId, error });
    return refuse(
      'Failed to check the takeaways allowance.',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }
  if (!claim) {
    logger.info(GENERATE_SKIM_LOG.ALLOWANCE_USED, { postId, tenantId });
    return refuseInactive();
  }

  return { isAllowed: true, tenant, claim };
};

export const releaseSkimGeneration = async (
  claim: TMaybeNull<TTakeawayGenerationClaim>,
  postId: string,
): Promise<void> => {
  if (!claim) return;

  try {
    await queries.takeawayGenerations.releaseTakeawayGeneration(claim);
  } catch (error) {
    logger.error(GENERATE_SKIM_LOG.CLAIM_RELEASE_FAILED, {
      postId,
      tenantId: claim.tenantId,
      error,
    });
  }
};
