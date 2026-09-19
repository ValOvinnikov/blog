import type { PostTakeaways } from '@blog/config';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { getWriteClient } from '@blog/service/sanity/write-client';

import type { TSaveSkimDraftInput } from './types';

const DRAFT_PREFIX = 'drafts.';

function toDraftId(postId: string): string {
  return postId.startsWith(DRAFT_PREFIX) ? postId : `${DRAFT_PREFIX}${postId}`;
}

function toPublishedId(postId: string): string {
  return postId.startsWith(DRAFT_PREFIX)
    ? postId.slice(DRAFT_PREFIX.length)
    : postId;
}

/**
 * Patches `postTakeaways` onto a post's *draft* only — never the published
 * document — so generated takeaways always need human approval (a Studio
 * publish) before readers see them. Idempotent: re-running always targets the
 * same draft id and `.set()`s the whole object, so it only ever overwrites
 * that one field, never other draft content and never the published document.
 */
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
