import type { TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { logger } from '@web/utils/logger/logger';

export type TLoadTenantSanityCredentialsInput = {
  type?: string;
  id?: string;
  tenantId: string;
};

/** Called once per webhook: the module lookup and the path derivation both need it, and a second fetch would report one failure as two. */
export const loadTenantSanityCredentials = async ({
  type,
  id,
  tenantId,
}: TLoadTenantSanityCredentialsInput): Promise<
  TMaybeUndefined<TTenantSanityContext>
> => {
  try {
    const credentials =
      await queries.tenants.getTenantSanityCredentials(tenantId);
    if (!credentials) {
      logger.error(REVALIDATE_LOG.TENANT_SANITY_CREDENTIALS_MISSING, {
        type,
        id,
        tenantId,
      });
    }
    return credentials;
  } catch (error) {
    logger.error(REVALIDATE_LOG.TENANT_SANITY_CREDENTIALS_FETCH_THREW, {
      type,
      id,
      tenantId,
      error,
    });
    return undefined;
  }
};
