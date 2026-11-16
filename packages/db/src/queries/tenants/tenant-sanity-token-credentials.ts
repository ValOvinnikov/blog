import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import type {
  TTenantProvisioningStatus,
  TTenantStatus,
} from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { requireTenantTokenEncryptionKey } from '@shinefold/db/utils/tenant-token-encryption-key/tenant-token-encryption-key';
import { decryptSecret } from '@shinefold/utils';

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
    token: decryptSecret(tokenEncrypted, requireTenantTokenEncryptionKey()),
    status,
    deprovisionedAt,
    provisioningStatus,
  };
}
