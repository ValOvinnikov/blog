import { FINDING_KIND, FINDING_SOURCE } from '@blog/config/constants';
import { buildDedupeKey } from '@blog/db/queries/findings/build-dedupe-key';

export function buildContrastDedupeKey(sha: string): string {
  return buildDedupeKey({
    source: FINDING_SOURCE.CONTRAST_CHECK,
    kind: FINDING_KIND.CONTRAST_REGRESSION,
    identifier: sha,
  });
}
