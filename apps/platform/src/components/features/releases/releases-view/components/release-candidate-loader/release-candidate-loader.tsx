import type { TReleaseCandidate } from '@platform/server/releases/get-release-candidate';
import type { TReleaseRun } from '@platform/server/releases/get-release-run';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import type { TMaybeUndefined } from '@shinefold/config';
import { use } from 'react';

import { ReleaseCandidateSection } from '../release-candidate-section/release-candidate-section';

export type TReleaseCandidateLoaderProps = {
  resultPromise: Promise<TReleaseResult<TReleaseCandidate>>;
  releaseRunPromise: Promise<TReleaseResult<TMaybeUndefined<TReleaseRun>>>;
};

export const ReleaseCandidateLoader = ({
  resultPromise,
  releaseRunPromise,
}: TReleaseCandidateLoaderProps) => (
  <ReleaseCandidateSection
    result={use(resultPromise)}
    releaseRun={use(releaseRunPromise)}
  />
);
