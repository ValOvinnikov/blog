import { RELEASE_CHANGE } from '@blog/config';
import type { TContrastStatus } from '@platform/constants/release';
import type { TComparedCommit } from '@platform/server/github/compare-commits';

import type { TReleaseChanges } from './classify-release-changes';
import { getCandidateComparison } from './get-candidate-comparison';
import type { TReleaseResult } from './release-result';
import { resolveContrastStatus } from './resolve-contrast-status';
import {
  summariseReleaseMigrations,
  type TReleaseMigrationSummary,
} from './summarise-release-migrations';

export type TReleaseCandidate = {
  headSha: string;
  lastTag: string;
  commits: TComparedCommit[];
  totalCommits: number;
  isFileListTruncated: boolean;
  changes: TReleaseChanges;
  migrations: TReleaseMigrationSummary;
  contrastStatus: TContrastStatus;
};

/** `main`'s HEAD measured against the latest `vX.Y.Z` tag. Never throws. */
export const getReleaseCandidate = async (): Promise<
  TReleaseResult<TReleaseCandidate>
> => {
  const comparison = await getCandidateComparison();
  if (!comparison.ok) return comparison;

  const {
    headSha,
    lastTag,
    commits,
    totalCommits,
    files,
    isFileListTruncated,
    changes,
  } = comparison.data;

  const [migrations, contrastStatus] = await Promise.all([
    summariseReleaseMigrations({ files, isFileListTruncated, headSha }),
    resolveContrastStatus({
      headSha,
      renderingChangedSinceTag: changes[RELEASE_CHANGE.RENDERING],
    }),
  ]);
  if (!migrations.ok) return migrations;
  if (!contrastStatus.ok) return contrastStatus;

  return {
    ok: true,
    data: {
      headSha,
      lastTag,
      commits,
      totalCommits,
      isFileListTruncated,
      changes,
      migrations: migrations.data,
      contrastStatus: contrastStatus.data,
    },
  };
};
