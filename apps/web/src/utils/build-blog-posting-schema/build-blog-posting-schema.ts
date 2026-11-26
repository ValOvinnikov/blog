import {
  LOCALE_BCP47_TAGS,
  routes,
  type TLocaleBcp47Tag,
  type TLocaleIsoCode,
  type TMaybeUndefined,
} from '@shinefold/config';
import {
  type TPostDetail,
  type TSanityProjectRef,
  urlForSanityImage,
} from '@shinefold/service';
import { hasLength } from '@shinefold/utils/primitives';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

export type TBlogPostingSchema = {
  '@context': 'https://schema.org';
  '@type': 'BlogPosting';
  headline: string;
  description: TMaybeUndefined<string>;
  image: TMaybeUndefined<string>;
  datePublished: string;
  dateModified: string;
  author: { '@type': 'Person'; name: string };
  url: string;
  keywords: TMaybeUndefined<string>;
  inLanguage: TLocaleBcp47Tag;
};

type TBlogPostingLanguage = {
  locale: TLocaleIsoCode;
  defaultLocale: TLocaleIsoCode;
};

export const buildBlogPostingSchema = (
  post: TPostDetail,
  base: TMaybeUndefined<URL>,
  project: TSanityProjectRef,
  { locale, defaultLocale }: TBlogPostingLanguage,
): TMaybeUndefined<TBlogPostingSchema> => {
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
    keywords: hasLength(post.tags)
      ? post.tags.map((tag) => tag.title).join(', ')
      : undefined,
    inLanguage: LOCALE_BCP47_TAGS[locale],
  };
};
