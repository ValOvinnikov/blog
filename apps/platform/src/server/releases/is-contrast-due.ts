import { RELEASE_CHANGE } from '@blog/config';
import { CONTRAST_STATUS } from '@platform/constants/release';

import { getCandidateComparison } from './get-candidate-comparison';
import { resolveContrastStatus } from './resolve-contrast-status';

/** False whenever the candidate cannot be read, so a GitHub or db failure never surfaces as "due". */
export const isContrastDue = async (): Promise<boolean> => {
  const comparison = await getCandidateComparison();
  if (!comparison.ok) return false;

  const { headSha, changes } = comparison.data;
  const status = await resolveContrastStatus({
    headSha,
    renderingChangedSinceTag: changes[RELEASE_CHANGE.RENDERING],
  });

  return status.ok && status.data === CONTRAST_STATUS.DUE;
};
