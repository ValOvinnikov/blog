import type { TMaybeUndefined } from '@blog/config';
import { errorResult, okResult, type TResult } from '@blog/utils';
import {
  isReleaseVersionGreater,
  parseReleaseVersion,
} from '@blog/utils/version';
import { type TGitHubFailure, GITHUB_LOG } from '@platform/constants/github';
import { RELEASE_FAILURE } from '@platform/constants/release';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

import { fetchGitHubJson } from './fetch-github';

const TAG_REF_PREFIX = 'refs/tags/';

const TAG_PAGE_SIZE = 100;

const MAX_TAG_PAGES = 10;

const tagRefsSchema = z.array(z.object({ ref: z.string() }));

/** A list still full at the page cap is `TAG_LIST_INCOMPLETE`, never a read of a different latest tag. */
export type TLatestReleaseTagResult = TResult<
  TMaybeUndefined<string>,
  TGitHubFailure | typeof RELEASE_FAILURE.TAG_LIST_INCOMPLETE
>;

const listReleaseTagRefs = async (): Promise<
  TResult<string[], TGitHubFailure | typeof RELEASE_FAILURE.TAG_LIST_INCOMPLETE>
> => {
  const refs: string[] = [];

  for (let page = 1; page <= MAX_TAG_PAGES; page += 1) {
    const result = await fetchGitHubJson(
      `/git/matching-refs/tags/v?per_page=${TAG_PAGE_SIZE}&page=${page}`,
      (body) => tagRefsSchema.parse(body).map(({ ref }) => ref),
    );
    if (!result.ok) return result;

    refs.push(...result.data);
    if (result.data.length < TAG_PAGE_SIZE) return okResult(refs);
  }

  logger.warn(GITHUB_LOG.TAG_LIST_INCOMPLETE, { pageCap: MAX_TAG_PAGES });
  return errorResult(RELEASE_FAILURE.TAG_LIST_INCOMPLETE);
};

export const getLatestReleaseTag =
  async (): Promise<TLatestReleaseTagResult> => {
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

    return okResult(latest);
  };
