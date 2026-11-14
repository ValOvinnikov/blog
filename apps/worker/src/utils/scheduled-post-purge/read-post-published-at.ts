import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import type { TTenantSanityCredentials } from '@blog/db/queries/tenants';
import { createPublishedTenantClient } from '@worker/utils/tenant-content/published-tenant-client';

const POST_PUBLISHED_AT_QUERY = `*[_type == "page_post" && _id == $postId][0].publishedAt`;

export async function readPostPublishedAt(
  credentials: TTenantSanityCredentials,
  postId: string,
): Promise<TMaybeUndefined<string>> {
  const publishedAt = await createPublishedTenantClient(credentials).fetch<
    TMaybeNull<string>
  >(POST_PUBLISHED_AT_QUERY, { postId });
  return publishedAt ?? undefined;
}
