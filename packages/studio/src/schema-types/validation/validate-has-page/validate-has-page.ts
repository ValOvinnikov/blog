import { getDraftsClient } from '@blog/studio/schema-types/validation/get-drafts-client/get-drafts-client';
import type { SanityDocument, ValidationContext } from 'sanity';

/**
 * Builds a document-level warning rule for a taxonomy term with no page
 * rendering it yet — the page's URL 404s with no runtime fallback in that
 * state, so the editor should see the gap on the term they'd fix it from.
 */
export const validateHasPage =
  (pageType: string, referenceField: string, noPageWarning: string) =>
  async (
    document: SanityDocument | undefined,
    context: ValidationContext,
  ): Promise<string | true> => {
    const publishedId = document?._id.replace(/^drafts\./, '');

    if (!publishedId) return true;

    const client = getDraftsClient(context);

    const referencingCount = await client.fetch<number>(
      `count(*[_type == $type && ${referenceField}._ref == $id])`,
      { type: pageType, id: publishedId },
    );

    return referencingCount > 0 ? true : noPageWarning;
  };
