import type { PostTakeaways } from '@blog/config';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { getWriteClient } from '@blog/service/sanity/write-client/write-client';
import { toDraftId, toPublishedId } from '@blog/utils/sanity-document-id';

import type { TSaveSkimDraftInput } from './types';

/** Writes only to the draft, so generated takeaways need a Studio publish before readers see them. */
export async function saveSkimDraft(
  { postId, takeaways, model }: TSaveSkimDraftInput,
  tenant: TTenantSanityContext,
): Promise<void> {
  const client = getWriteClient(tenant);
  const draftId = toDraftId(postId);
  const publishedId = toPublishedId(postId);

  const published = await client.getDocument(publishedId);
  if (!published) {
    throw new Error(
      `saveSkimDraft: no published post found for "${publishedId}"`,
    );
  }

  const postTakeaways: PostTakeaways = {
    _type: 'postTakeaways',
    takeaways,
    generatedAt: new Date().toISOString(),
    model,
  };

  await client
    .transaction()
    .createIfNotExists({ ...published, _id: draftId })
    .patch(draftId, { set: { postTakeaways } })
    .commit();
}
