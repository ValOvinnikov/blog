import { type TGitHubFailure, GITHUB_LOG } from '@platform/constants/github';
import { RELEASE_FAILURE } from '@platform/constants/release';
import { logger } from '@platform/utils/logger/logger';
import type { TMaybeUndefined } from '@shinefold/config';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { isNull } from '@shinefold/utils/primitives';
import {
  isReleaseVersionGreater,
  parseReleaseVersion,
} from '@shinefold/utils/version';
import { z } from 'zod';

import { fetchGitHubJson } from './fetch-github';

const TAG_REF_PREFIX = 'refs/tags/';

const TAG_PAGE_SIZE = 100;

const MAX_TAG_PAGES = 10;

const tagRefsSchema = z.array(
  z.object({ ref: z.string(), object: z.object({ sha: z.string() }) }),
);

export type TReleaseTag = {
  name: string;
  sha: string;
};

/** A list still full at the page cap is `TAG_LIST_INCOMPLETE`, never a read of a different latest tag. */
export type TLatestReleaseTagResult = TResult<
  TMaybeUndefined<TReleaseTag>,
  TGitHubFailure | typeof RELEASE_FAILURE.TAG_LIST_INCOMPLETE
>;

const listReleaseTags = async (): Promise<
  TResult<
    TReleaseTag[],
    TGitHubFailure | typeof RELEASE_FAILURE.TAG_LIST_INCOMPLETE
  >
> => {
  const tags: TReleaseTag[] = [];

  for (let page = 1; page <= MAX_TAG_PAGES; page += 1) {
    const result = await fetchGitHubJson(
      `/git/matching-refs/tags/v?per_page=${TAG_PAGE_SIZE}&page=${page}`,
      (body) =>
        tagRefsSchema.parse(body).map(({ ref, object }) => ({
          name: ref.slice(TAG_REF_PREFIX.length),
          sha: object.sha,
        })),
    );
    if (!result.ok) return result;

    tags.push(...result.data);
    if (result.data.length < TAG_PAGE_SIZE) return okResult(tags);
  }

  logger.warn(GITHUB_LOG.TAG_LIST_INCOMPLETE, { pageCap: MAX_TAG_PAGES });
  return errorResult(RELEASE_FAILURE.TAG_LIST_INCOMPLETE);
};

export const getLatestReleaseTag =
  async (): Promise<TLatestReleaseTagResult> => {
    const result = await listReleaseTags();
    if (!result.ok) return result;

    const latest = result.data
      .filter(({ name }) => !isNull(parseReleaseVersion(name)))
      .reduce<TMaybeUndefined<TReleaseTag>>(
        (greatest, tag) =>
          !greatest || isReleaseVersionGreater(tag.name, greatest.name)
            ? tag
            : greatest,
        undefined,
      );

    return okResult(latest);
  };
