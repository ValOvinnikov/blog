import { errorResult, okResult } from '@blog/utils';
import {
  compareCommits,
  type TCommitComparison,
} from '@platform/server/github/compare-commits';
import { getBranchHeadSha } from '@platform/server/github/get-branch-head-sha';
import { getLatestReleaseTag } from '@platform/server/github/get-latest-release-tag';

import {
  classifyReleaseChanges,
  type TReleaseChanges,
} from './classify-release-changes';
import { toReleaseFailure, type TReleaseResult } from './release-result';

type TCandidateComparison = TCommitComparison & {
  headSha: string;
  lastTag: string;
  changes: TReleaseChanges;
};

export const getCandidateComparison = async (): Promise<
  TReleaseResult<TCandidateComparison>
> => {
  const [lastTag, headSha] = await Promise.all([
    getLatestReleaseTag(),
    getBranchHeadSha(),
  ]);
  if (!lastTag.ok) return toReleaseFailure(lastTag.error);
  if (!headSha.ok) return toReleaseFailure(headSha.error);
  if (!lastTag.data) return errorResult('noReleaseTag');

  const comparison = await compareCommits(lastTag.data, headSha.data);
  if (!comparison.ok) return toReleaseFailure(comparison.error);

  const { files, isFileListTruncated } = comparison.data;

  return okResult({
    ...comparison.data,
    headSha: headSha.data,
    lastTag: lastTag.data,
    changes: classifyReleaseChanges(files, isFileListTruncated),
  });
};
