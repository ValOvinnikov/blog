import { POST_SOURCE } from '@blog/config/constants';
import { getDraftsClient } from '@blog/studio/schema-types/helpers/get-drafts-client';
import type { SanityDocument, ValidationContext } from 'sanity';

type TPostSourceDocument = { postSource?: string };

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
      `count(*[_type == "blog_post" && featured == true && publishedAt <= now()])`,
    );

    return count > 0
      ? true
      : `No published post is marked Featured, so this ${renderTarget} would render empty.`;
  };
