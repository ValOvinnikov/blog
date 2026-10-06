import {
  LOCALE_BCP47_TAGS,
  routes,
  type TLocaleBcp47Tag,
  type TLocaleIsoCode,
} from '@blog/config';
import {
  type TPostDetail,
  type TSanityProjectRef,
  urlForSanityImage,
} from '@blog/service';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

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
  inLanguage: TLocaleBcp47Tag;
};

type TBlogPostingLanguage = {
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

export const buildBlogPostingSchema = (
  post: TPostDetail,
  base: URL | undefined,
  project: TSanityProjectRef,
  { locale, defaultLocale }: TBlogPostingLanguage,
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
    url: new URL(
      toLocalizedPathname({
        href: routes.post(post.slug),
        locale,
        defaultLocale,
      }),
      base,
    ).href,
    keywords:
      post.tags.length > 0
        ? post.tags.map((tag) => tag.title).join(', ')
        : undefined,
    inLanguage: LOCALE_BCP47_TAGS[locale],
  };
};
