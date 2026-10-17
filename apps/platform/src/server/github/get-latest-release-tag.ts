import type { TMaybeUndefined } from '@blog/config';
import {
  isReleaseVersionGreater,
  parseReleaseVersion,
} from '@blog/utils/version';
import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const TAG_REF_PREFIX = 'refs/tags/';

const tagRefsSchema = z.array(z.object({ ref: z.string() }));

export const getLatestReleaseTag = async (): Promise<
  TGitHubResult<TMaybeUndefined<string>>
> => {
  const result = await fetchGitHubJson('/git/matching-refs/tags/v', (body) =>
    tagRefsSchema.parse(body),
  );
  if (!result.ok) return result;

  const latest = result.data
    .map(({ ref }) => ref.slice(TAG_REF_PREFIX.length))
    .filter((tag) => parseReleaseVersion(tag) !== null)
    .reduce<TMaybeUndefined<string>>(
      (greatest, tag) =>
        !greatest || isReleaseVersionGreater(tag, greatest) ? tag : greatest,
      undefined,
    );

  return { ok: true, data: latest };
};
