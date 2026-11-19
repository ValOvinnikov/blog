import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import type {
  TTenantProvisioningStatus,
  TTenantStatus,
} from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { decryptTenantSecret } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';

export type TTenantSanityTokenCredentials = {
  projectId: string;
  dataset: string;
  token: string;
  status: TTenantStatus;
  deprovisionedAt: TMaybeNull<Date>;
  provisioningStatus: TMaybeNull<TTenantProvisioningStatus>;
};

export function toTenantSanityTokenCredentials(
  tenant: TTenant,
  tokenEncrypted: TMaybeNull<string>,
): TMaybeUndefined<TTenantSanityTokenCredentials> {
  const {
    sanityProjectId,
    sanityDataset,
    status,
    deprovisionedAt,
    provisioningStatus,
  } = tenant;

  if (!tokenEncrypted || !sanityProjectId || !sanityDataset) return undefined;

  return {
    projectId: sanityProjectId,
    dataset: sanityDataset,
    token: decryptTenantSecret(tokenEncrypted),
    status,
    deprovisionedAt,
    provisioningStatus,
  };
}
