import { queries } from '@blog/db';
import { okResult } from '@blog/utils';

import { readDb, type TReleaseResult } from './release-result';

export type TFailedMigrationTenant = {
  id: string;
  name: string;
  failedAt: Date;
};

/** The in-scope tenants whose last content migration failed, newest failure first. Never throws. */
export const listFailedMigrationTenants = async (): Promise<
  TReleaseResult<TFailedMigrationTenant[]>
> => {
  const tenants = await readDb(() => queries.tenants.listActiveTenants());
  if (!tenants.ok) return tenants;

  const failed = tenants.data.flatMap(
    ({ id, name, contentMigrationFailedAt }) =>
      contentMigrationFailedAt
        ? [{ id, name, failedAt: contentMigrationFailedAt }]
        : [],
  );

  return okResult(
    failed.sort((a, b) => b.failedAt.getTime() - a.failedAt.getTime()),
  );
};
