import { DetailCardSkeleton } from '@platform/components/shared/detail-card-skeleton';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TReleaseCandidate } from '@platform/server/releases/get-release-candidate';
import type { TReleaseRun } from '@platform/server/releases/get-release-run';
import type { TFailedMigrationTenant } from '@platform/server/releases/list-failed-migration-tenants';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import { tv } from '@platform/utils/tv/tv';
import type { TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';

import { FailedMigrationsLoader } from './components/failed-migrations-loader/failed-migrations-loader';
import { ReleaseCandidateLoader } from './components/release-candidate-loader/release-candidate-loader';
import { ReleaseCandidateSkeleton } from './components/release-candidate-skeleton/release-candidate-skeleton';

const releasesViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
  },
});

export type TReleasesViewProps = {
  resultPromise: Promise<TReleaseResult<TReleaseCandidate>>;
  releaseRunPromise: Promise<TReleaseResult<TMaybeUndefined<TReleaseRun>>>;
  failedTenantsPromise: Promise<TReleaseResult<TFailedMigrationTenant[]>>;
};

export const ReleasesView = ({
  resultPromise,
  releaseRunPromise,
  failedTenantsPromise,
}: TReleasesViewProps) => {
  const t = useTranslations('releasesView');
  const { root } = releasesViewVariants();

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      <Suspense fallback={<ReleaseCandidateSkeleton />}>
        <ReleaseCandidateLoader
          resultPromise={resultPromise}
          releaseRunPromise={releaseRunPromise}
        />
      </Suspense>
      <Suspense fallback={<DetailCardSkeleton rowCount={1} />}>
        <FailedMigrationsLoader failedTenantsPromise={failedTenantsPromise} />
      </Suspense>
    </div>
  );
};
