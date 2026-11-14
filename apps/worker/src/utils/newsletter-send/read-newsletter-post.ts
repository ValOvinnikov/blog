import type { Page_post } from '@blog/config';
import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import type { TTenantSanityCredentials } from '@blog/db/queries/tenants';
import { createPublishedTenantClient } from '@worker/utils/tenant-content/published-tenant-client';

type TRawNewsletterPost = Pick<
  Page_post,
  | 'title'
  | 'slug'
  | 'headingBlock'
  | 'seo'
  | 'publishedAt'
  | 'sendToSubscribers'
  | 'postTakeaways'
> & { coverImageUrl?: string };

export type TNewsletterPost = {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  isSendToSubscribersOn: boolean;
  coverImageUrl: TMaybeUndefined<string>;
  takeaways: string[];
};

const NEWSLETTER_POST_QUERY = `*[_type == "page_post" && _id == $postId][0]{
  title, slug, headingBlock, seo, publishedAt, sendToSubscribers, postTakeaways,
  "coverImageUrl": heroImage.asset->url
}`;

function toNewsletterPost(
  raw: TRawNewsletterPost,
): TMaybeUndefined<TNewsletterPost> {
  const { headingBlock, title, slug, seo, publishedAt, postTakeaways } = raw;
  const postTitle = headingBlock?.heading ?? title;
  if (!postTitle || !slug?.current || !publishedAt) return undefined;

  return {
    title: postTitle,
    excerpt: headingBlock?.supportingText ?? seo?.metaDescription ?? '',
    slug: slug.current,
    publishedAt,
    isSendToSubscribersOn: raw.sendToSubscribers === true,
    coverImageUrl: raw.coverImageUrl,
    takeaways: postTakeaways?.takeaways ?? [],
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
