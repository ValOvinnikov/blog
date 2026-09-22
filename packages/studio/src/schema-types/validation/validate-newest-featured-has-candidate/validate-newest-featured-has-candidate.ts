import { POST_SOURCE } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { PUBLISHED_POST_CONDITION } from '@blog/studio/schema-types/filters/published-post/published-post';
import { getDraftsClient } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { ValidationContext } from 'sanity';

export const validateNewestFeaturedHasCandidate =
  (renderTarget: string) =>
  async (
    value: string | undefined,
    context: ValidationContext,
  ): Promise<string | true> => {
    if (value !== POST_SOURCE.NEWEST_FEATURED) return true;

    const client = getDraftsClient(context);
    const count = await client.fetch<number>(
      `count(*[_type == "${PAGE_POST_TYPE}" && featured == true && ${PUBLISHED_POST_CONDITION}])`,
    );

    return count > 0
      ? true
      : `No published post is marked Featured, so this ${renderTarget} would render empty.`;
  };
