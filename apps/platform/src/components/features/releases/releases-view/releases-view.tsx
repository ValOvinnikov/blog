import { ALERT_TYPE, RELEASE_CHANGE, type TMaybeUndefined } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { PageHeader } from '@platform/components/shared/page-header';
import { GITHUB_COMPARE_FILE_LIMIT } from '@platform/constants/release';
import type { TReleaseCandidate } from '@platform/server/releases/get-release-candidate';
import type { TReleaseRun } from '@platform/server/releases/get-release-run';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import { isReleaseOverrideRequired } from '@platform/utils/release-state/release-state';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

import { ReleaseAreasCard } from './components/release-areas-card/release-areas-card';
import { ReleaseCard } from './components/release-card/release-card';
import { ReleaseCommits } from './components/release-commits/release-commits';
import { ReleaseContrastCard } from './components/release-contrast-card/release-contrast-card';
import { ReleaseSummaryCard } from './components/release-summary-card/release-summary-card';
import { ReleaseUnavailable } from './components/release-unavailable/release-unavailable';

const releasesViewVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
  },
});

export type TReleasesViewProps = {
  result: TReleaseResult<TReleaseCandidate>;
  releaseRun: TReleaseResult<TMaybeUndefined<TReleaseRun>>;
};

export const ReleasesView = ({ result, releaseRun }: TReleasesViewProps) => {
  const t = useTranslations('releasesView');
  const { root } = releasesViewVariants();

  if (!result.ok) {
    return (
      <div className={root()}>
        <PageHeader title={t('title')} description={t('description')} />
        <ReleaseUnavailable reason={result.reason} />
      </div>
    );
  }

  const {
    headSha,
    lastTag,
    commits,
    totalCommits,
    isFileListTruncated,
    changes,
    migrations,
    contrastStatus,
  } = result.data;

  return (
    <div className={root()}>
      <PageHeader title={t('title')} description={t('description')} />
      <ReleaseSummaryCard
        lastTag={lastTag}
        headSha={headSha}
        totalCommits={totalCommits}
      />
      {isFileListTruncated && (
        <Alert
          type={ALERT_TYPE.WARNING}
          title={t('incompleteTitle')}
          description={t('incompleteDescription', {
            limit: GITHUB_COMPARE_FILE_LIMIT,
          })}
        />
      )}
      <ReleaseCommits
        commits={commits}
        totalCommits={totalCommits}
        lastTag={lastTag}
      />
      {totalCommits > 0 && (
        <>
          <ReleaseAreasCard changes={changes} migrations={migrations} />
          <ReleaseContrastCard status={contrastStatus} />
        </>
      )}
      <ReleaseCard
        lastTag={lastTag}
        hasChanges={totalCommits > 0}
        migrations={migrations}
        isOverrideRequired={isReleaseOverrideRequired({
          isRenderingChanged: changes[RELEASE_CHANGE.RENDERING],
          contrastStatus,
        })}
        releaseRun={releaseRun}
      />
    </div>
  );
};
