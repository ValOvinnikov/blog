import { POST_SOURCE } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PUBLISHED_POST_CONDITION } from '@blog/studio/schema-types/filters/published-post';
import { fetchDraftsFailSafe } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { ValidationContext } from 'sanity';

const FAIL_SAFE_ASSUMES_CANDIDATE = 1;

export const validateNewestFeaturedHasCandidate =
  (renderTarget: string) =>
  async (
    value: string | undefined,
    context: ValidationContext,
  ): Promise<string | true> => {
    if (value !== POST_SOURCE.NEWEST_FEATURED) return true;

    const count = await fetchDraftsFailSafe<number>(
      context,
      `count(*[_type == "${PAGE_POST_TYPE}" && featured == true && ${PUBLISHED_POST_CONDITION}])`,
      {},
      FAIL_SAFE_ASSUMES_CANDIDATE,
    );

    return count > 0
      ? true
      : `No published post is marked Featured, so this ${renderTarget} would render empty.`;
  };
