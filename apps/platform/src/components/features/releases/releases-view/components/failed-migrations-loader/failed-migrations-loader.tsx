import type { TFailedMigrationTenant } from '@platform/server/releases/list-failed-migration-tenants';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import { use } from 'react';

import { TenantMigrationsCard } from '../tenant-migrations-card/tenant-migrations-card';

export type TFailedMigrationsLoaderProps = {
  failedTenantsPromise: Promise<TReleaseResult<TFailedMigrationTenant[]>>;
};

export const FailedMigrationsLoader = ({
  failedTenantsPromise,
}: TFailedMigrationsLoaderProps) => (
  <TenantMigrationsCard failedTenants={use(failedTenantsPromise)} />
);
