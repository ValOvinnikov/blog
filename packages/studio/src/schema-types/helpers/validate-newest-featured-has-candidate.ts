import { POST_SOURCE } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import type { SanityDocument, ValidationContext } from 'sanity';

type TPostSourceDocument = { postSource?: string };

/**
 * Mirrors `PUBLISHED_POST_FILTER` (`packages/service/src/shared/filters/published-post.ts`)
 * so Studio-side validation queries track exactly what the runtime
 * hero/spotlight query considers a candidate. `@blog/studio` cannot import
 * `@blog/service`, so the condition is duplicated here — keep the two in
 * sync by hand.
 */
export const PUBLISHED_POST_CONDITION =
  'publishedAt <= now() && defined(headingBlock.heading) && defined(author) && defined(topic) && defined(content)';

/**
 * Builds a document-level validator erroring when Post Source is Newest
 * Featured but no published post is marked Featured — shared by every
 * module offering that source, each supplying the noun for its own message.
 */
export const validateNewestFeaturedHasCandidate =
  (renderTarget: string) =>
  async (
    document: SanityDocument | undefined,
    context: ValidationContext,
  ): Promise<string | true> => {
    const doc = document as TPostSourceDocument | undefined;

    if (doc?.postSource !== POST_SOURCE.NEWEST_FEATURED) return true;

    const client = getDraftsClient(context);
    const count = await client.fetch<number>(
      `count(*[_type == "${PAGE_POST_TYPE}" && featured == true && ${PUBLISHED_POST_CONDITION}])`,
    );

    return count > 0
      ? true
      : `No published post is marked Featured, so this ${renderTarget} would render empty.`;
  };
