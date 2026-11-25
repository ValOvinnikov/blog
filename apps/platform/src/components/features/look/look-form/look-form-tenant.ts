import type { TGrantAccess } from '@platform/utils/grant-target/grant-target';
import type { TPresetId } from '@shinefold/config';
import type { TLookField } from '@shinefold/db/constants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import type { TTenantEntitlements } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';

export type TLookFormTenant = Pick<TTenant, 'id' | 'name'> &
  Pick<TTenantEntitlements, 'lookFields'> & {
    siteHost: string;
    presets: readonly TPresetId[];
    grants: TGrantAccess<TLookField>;
    archivedAt?: Date;
  };
