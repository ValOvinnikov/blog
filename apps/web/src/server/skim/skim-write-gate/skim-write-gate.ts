import { HTTP_STATUS, type TMaybeNull } from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TTakeawayGenerationClaim } from '@shinefold/db/queries/takeaway-generations/claim-takeaway-generation';
import type { TTenantSanityContext } from '@shinefold/service';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import type { TTenantSanityWriteContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

export type TSkimRefusal = { message: string; status: number };

type TSkimWriteGate =
  | {
      isAllowed: true;
      tenant: TTenantSanityWriteContext['tenant'];
      claim: TMaybeNull<TTakeawayGenerationClaim>;
    }
  | { isAllowed: false; refusal: TSkimRefusal };

const refuse = (message: string, status: number): TSkimWriteGate => ({
  isAllowed: false,
  refusal: { message, status },
});

const refuseInactive = (): TSkimWriteGate =>
  refuse(
    'The requesting tenant is not permitted to write.',
    HTTP_STATUS.FORBIDDEN,
  );

const claimGeneration = async (
  postId: string,
  tenantId: string,
  tenant: TTenantSanityContext,
): Promise<TSkimWriteGate> => {
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

export const gateSkimWrite = async (
  postId: string,
  { tenant, tenantId, isActive }: TTenantSanityWriteContext,
): Promise<TSkimWriteGate> => {
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

  return claimGeneration(postId, tenantId, tenant);
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
