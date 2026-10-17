import type { TMaybeUndefined } from '@blog/config';
import {
  isReleaseVersionGreater,
  parseReleaseVersion,
} from '@blog/utils/version';
import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const TAG_REF_PREFIX = 'refs/tags/';

const TAG_PAGE_SIZE = 100;

const tagRefsSchema = z.array(z.object({ ref: z.string() }));

const listReleaseTagRefs = async (
  page = 1,
): Promise<TGitHubResult<string[]>> => {
  const result = await fetchGitHubJson(
    `/git/matching-refs/tags/v?per_page=${TAG_PAGE_SIZE}&page=${page}`,
    (body) => tagRefsSchema.parse(body).map(({ ref }) => ref),
  );
  if (!result.ok || result.data.length < TAG_PAGE_SIZE) return result;

  const rest = await listReleaseTagRefs(page + 1);
  return rest.ok ? { ok: true, data: [...result.data, ...rest.data] } : rest;
};

export const getLatestReleaseTag = async (): Promise<
  TGitHubResult<TMaybeUndefined<string>>
> => {
  const result = await listReleaseTagRefs();
  if (!result.ok) return result;

  const latest = result.data
    .map((ref) => ref.slice(TAG_REF_PREFIX.length))
    .filter((tag) => parseReleaseVersion(tag) !== null)
    .reduce<TMaybeUndefined<string>>(
      (greatest, tag) =>
        !greatest || isReleaseVersionGreater(tag, greatest) ? tag : greatest,
      undefined,
    );

  return { ok: true, data: latest };
};
