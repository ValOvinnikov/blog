import { routes } from '@blog/config';
import {
  type TPostDetail,
  type TSanityProjectRef,
  urlForSanityImage,
} from '@blog/service';

export type TBlogPostingSchema = {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: string | undefined;
  image: string | undefined;
  datePublished: string;
  dateModified: string;
  author: { '@type': 'Person'; name: string };
  url: string;
  keywords: string | undefined;
};

export const buildBlogPostingSchema = (
  post: TPostDetail,
  base: URL | undefined,
  project: TSanityProjectRef,
): TBlogPostingSchema | undefined => {
  if (!base) return undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.heroImage
      ? urlForSanityImage(post.heroImage, project)
      : undefined,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { '@type': 'Person', name: post.author.name },
    url: new URL(routes.post(post.slug), base).href,
    keywords:
      post.tags.length > 0
        ? post.tags.map((tag) => tag.title).join(', ')
        : undefined,
  };
};
