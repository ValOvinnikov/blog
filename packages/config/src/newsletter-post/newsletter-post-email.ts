import type { Page_post } from '@shinefold/config/sanity/generated/types';
import type { TMaybeUndefined, TPostSummary } from '@shinefold/config/types';

export const NEWSLETTER_POST_EMAIL_PROJECTION = `title, slug, headingBlock, seo, postTakeaways, "coverImageUrl": heroImage.asset->url`;

export type TRawNewsletterPostEmail = Pick<
  Page_post,
  'title' | 'slug' | 'headingBlock' | 'seo' | 'postTakeaways'
> & { coverImageUrl?: string };

export type TNewsletterPostEmail = {
  title: string;
  excerpt: string;
  slug: string;
  coverImageUrl: TMaybeUndefined<string>;
  summary: TPostSummary;
};

/** The post fields the subscriber email and its test share; `undefined` when the post has no title or slug to send. */
export const toNewsletterPostEmail = ({
  headingBlock,
  title,
  slug,
  seo,
  postTakeaways,
  coverImageUrl,
}: TRawNewsletterPostEmail): TMaybeUndefined<TNewsletterPostEmail> => {
  const postTitle = headingBlock?.heading ?? title;
  if (!postTitle || !slug?.current) return undefined;

  return {
    title: postTitle,
    excerpt: headingBlock?.supportingText ?? seo?.metaDescription ?? '',
    slug: slug.current,
    coverImageUrl,
    summary: postTakeaways?.summary ?? [],
  };
};
