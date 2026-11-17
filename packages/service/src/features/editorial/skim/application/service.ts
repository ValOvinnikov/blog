import { getPublishedPostBody } from '@shinefold/service/features/editorial/skim/adaptor/get-post-body/loader';
import { hasPostTakeaways } from '@shinefold/service/features/editorial/skim/adaptor/has-post-takeaways/loader';
import { saveSkimDraft } from '@shinefold/service/features/editorial/skim/adaptor/save-skim-draft/loader';
import type { TSaveSkimDraftInput } from '@shinefold/service/features/editorial/skim/adaptor/save-skim-draft/types';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createSkimService() {
  return {
    v1: {
      getPublishedPostBody: safeAsync(
        (postId: string, tenant: TTenantSanityContext) =>
          getPublishedPostBody(postId, tenant),
      ),
      hasPostTakeaways: safeAsync(
        (postId: string, tenant: TTenantSanityContext) =>
          hasPostTakeaways(postId, tenant),
      ),
      saveSkimDraft: safeAsync(
        (input: TSaveSkimDraftInput, tenant: TTenantSanityContext) =>
          saveSkimDraft(input, tenant),
      ),
    },
  };
}
