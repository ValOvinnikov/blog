import type { TMaybeUndefined } from '@blog/config';
import { errorResult, okResult, type TResult } from '@blog/utils';
import {
  isReleaseVersionGreater,
  parseReleaseVersion,
} from '@blog/utils/version';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

import { fetchGitHubJson, type TGitHubFailureReason } from './fetch-github';

const TAG_REF_PREFIX = 'refs/tags/';

const TAG_PAGE_SIZE = 100;

const MAX_TAG_PAGES = 10;

const tagRefsSchema = z.array(z.object({ ref: z.string() }));

/** A list still full at the page cap is `tagListIncomplete`, never a read of a different latest tag. */
export type TLatestReleaseTagResult = TResult<
  TMaybeUndefined<string>,
  TGitHubFailureReason | 'tagListIncomplete'
>;

const listReleaseTagRefs = async (): Promise<
  TResult<string[], TGitHubFailureReason | 'tagListIncomplete'>
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

  logger.warn('github.tag_list_incomplete', { pageCap: MAX_TAG_PAGES });
  return errorResult('tagListIncomplete');
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
