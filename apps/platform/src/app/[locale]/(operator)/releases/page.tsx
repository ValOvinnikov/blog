import { ReleasesView } from '@platform/components/features/releases/releases-view';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { getReleaseCandidate } from '@platform/server/releases/get-release-candidate';
import { getReleaseRun } from '@platform/server/releases/get-release-run';
import { listFailedMigrationTenants } from '@platform/server/releases/list-failed-migration-tenants';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('releases');
}

export default async function ReleasesPage() {
  await requireSuperAdmin();

  const [result, releaseRun, failedMigrationTenants] = await Promise.all([
    getReleaseCandidate(),
    getReleaseRun(),
    listFailedMigrationTenants(),
  ]);

  return (
    <ReleasesView
      result={result}
      releaseRun={releaseRun}
      failedMigrationTenants={failedMigrationTenants}
    />
  );
}
