import { Alert } from '@platform/components/shared/alert';
import { GITHUB_COMPARE_FILE_LIMIT } from '@platform/constants/release';
import type { TReleaseCandidate } from '@platform/server/releases/get-release-candidate';
import type { TReleaseRun } from '@platform/server/releases/get-release-run';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import { isReleaseOverrideRequired } from '@platform/utils/release-state/release-state';
import {
  ALERT_TYPE,
  RELEASE_CHANGE,
  type TMaybeUndefined,
} from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { ReleaseAreasCard } from '../release-areas-card/release-areas-card';
import { ReleaseCard } from '../release-card/release-card';
import { ReleaseCommits } from '../release-commits/release-commits';
import { ReleaseContrastCard } from '../release-contrast-card/release-contrast-card';
import { ReleaseSummaryCard } from '../release-summary-card/release-summary-card';
import { ReleaseUnavailable } from '../release-unavailable/release-unavailable';

export type TReleaseCandidateSectionProps = {
  result: TReleaseResult<TReleaseCandidate>;
  releaseRun: TReleaseResult<TMaybeUndefined<TReleaseRun>>;
};

export const ReleaseCandidateSection = ({
  result,
  releaseRun,
}: TReleaseCandidateSectionProps) => {
  const t = useTranslations('releasesView');

  if (!result.ok) return <ReleaseUnavailable reason={result.error} />;

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
    <>
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
        headSha={headSha}
        lastTag={lastTag}
        hasChanges={totalCommits > 0}
        migrations={migrations}
        isOverrideRequired={isReleaseOverrideRequired({
          isRenderingChanged: changes[RELEASE_CHANGE.RENDERING],
          contrastStatus,
        })}
        releaseRun={releaseRun}
      />
    </>
  );
};
