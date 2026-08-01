import { getPublishedPostBody } from '@blog/service/features/editorial/skim/adaptor/get-post-body/loader';
import { saveSkimDraft } from '@blog/service/features/editorial/skim/adaptor/save-skim-draft/loader';
import type { TSaveSkimDraftInput } from '@blog/service/features/editorial/skim/adaptor/save-skim-draft/types';
import { safeAsync } from '@blog/utils';

export function createSkimService() {
  return {
    v1: {
      getPublishedPostBody: safeAsync((postId: string) =>
        getPublishedPostBody(postId),
      ),
      saveSkimDraft: safeAsync((input: TSaveSkimDraftInput) =>
        saveSkimDraft(input),
      ),
    },
  };
}
