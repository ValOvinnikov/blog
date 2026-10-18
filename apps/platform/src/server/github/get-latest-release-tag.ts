import type { TMaybeUndefined } from '@blog/config';
import {
  isReleaseVersionGreater,
  parseReleaseVersion,
} from '@blog/utils/version';
import { logger } from '@platform/utils/logger/logger';
import { z } from 'zod';

import { fetchGitHubJson, type TGitHubResult } from './fetch-github';

const TAG_REF_PREFIX = 'refs/tags/';

const TAG_PAGE_SIZE = 100;

const MAX_TAG_PAGES = 10;

const tagRefsSchema = z.array(z.object({ ref: z.string() }));

type TTagListIncomplete = { ok: false; reason: 'tagListIncomplete' };

/** A list still full at the page cap is `tagListIncomplete`, never a read of a different latest tag. */
export type TLatestReleaseTagResult =
  TGitHubResult<TMaybeUndefined<string>> | TTagListIncomplete;

const listReleaseTagRefs = async (): Promise<
  TGitHubResult<string[]> | TTagListIncomplete
> => {
  const refs: string[] = [];

  for (let page = 1; page <= MAX_TAG_PAGES; page += 1) {
    const result = await fetchGitHubJson(
      `/git/matching-refs/tags/v?per_page=${TAG_PAGE_SIZE}&page=${page}`,
      (body) => tagRefsSchema.parse(body).map(({ ref }) => ref),
    );
    if (!result.ok) return result;

    refs.push(...result.data);
    if (result.data.length < TAG_PAGE_SIZE) return { ok: true, data: refs };
  }

  logger.warn('github.tag_list_incomplete', { pageCap: MAX_TAG_PAGES });
  return { ok: false, reason: 'tagListIncomplete' };
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

    return { ok: true, data: latest };
  };
