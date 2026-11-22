import {
  NEWSLETTER_POST_EMAIL_PROJECTION,
  type Page_post,
  type TNewsletterPostEmail,
  type TRawNewsletterPostEmail,
  toNewsletterPostEmail,
} from '@shinefold/config';
import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import type { TTenantSanityCredentials } from '@shinefold/db/queries/tenants';
import { createPublishedTenantClient } from '@worker/utils/tenant-content/published-tenant-client';

type TRawNewsletterPost = TRawNewsletterPostEmail &
  Pick<Page_post, 'publishedAt' | 'sendToSubscribers'>;

export type TNewsletterPost = TNewsletterPostEmail & {
  publishedAt: string;
  isSendToSubscribersOn: boolean;
};

const NEWSLETTER_POST_QUERY = `*[_type == "page_post" && _id == $postId][0]{
  ${NEWSLETTER_POST_EMAIL_PROJECTION}, publishedAt, sendToSubscribers
}`;

function toNewsletterPost(
  raw: TRawNewsletterPost,
): TMaybeUndefined<TNewsletterPost> {
  const email = toNewsletterPostEmail(raw);
  const { publishedAt } = raw;
  if (!email || !publishedAt) return undefined;

  return {
    ...email,
    publishedAt,
    isSendToSubscribersOn: raw.sendToSubscribers === true,
  };
}

export async function readNewsletterPost(
  credentials: TTenantSanityCredentials,
  postId: string,
): Promise<TMaybeUndefined<TNewsletterPost>> {
  const raw = await createPublishedTenantClient(credentials).fetch<
    TMaybeNull<TRawNewsletterPost>
  >(NEWSLETTER_POST_QUERY, { postId });

  return raw ? toNewsletterPost(raw) : undefined;
}
