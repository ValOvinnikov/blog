import type { PostTakeaways } from '@shinefold/config';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { getWriteClient } from '@shinefold/service/sanity/write-client/write-client';
import { hasBlockText } from '@shinefold/utils/portable-text';
import { toDraftId, toPublishedId } from '@shinefold/utils/sanity-document-id';

type TPostTakeawaysDocument = { postTakeaways?: PostTakeaways };

/** Reads the draft as well as the published post, so a summary awaiting an editor's review counts. */
export async function hasPostTakeaways(
  postId: string,
  tenant: TTenantSanityContext,
): Promise<boolean> {
  const client = getWriteClient(tenant);
  const documents = await Promise.all(
    [toDraftId(postId), toPublishedId(postId)].map((id) =>
      client.getDocument<TPostTakeawaysDocument>(id),
    ),
  );
  return documents.some((document) =>
    hasBlockText(document?.postTakeaways?.summary ?? []),
  );
}
