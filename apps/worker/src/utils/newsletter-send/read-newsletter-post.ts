import type { Page_post } from '@blog/config';
import { SANITY_PERSPECTIVE } from '@blog/config/constants';
import type { TMaybeNull, TMaybeUndefined } from '@blog/config/types';
import type { TTenantSanityCredentials } from '@blog/db/queries/tenants';
import { SANITY_API_VERSION } from '@worker/constants/sanity-api';
import { createClientWithTimeout } from '@worker/utils/step-deps/step-deps';

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
  { projectId, dataset, token }: TTenantSanityCredentials,
  postId: string,
): Promise<TMaybeUndefined<TNewsletterPost>> {
  const raw = await createClientWithTimeout({
    projectId,
    dataset,
    token,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    perspective: SANITY_PERSPECTIVE.PUBLISHED,
  }).fetch<TMaybeNull<TRawNewsletterPost>>(NEWSLETTER_POST_QUERY, { postId });

  return raw ? toNewsletterPost(raw) : undefined;
}
