import type { TPostCard } from '#/shared/transformers/to-post-card';
import type { TSanityImage } from '#/shared/transformers/to-sanity-image';
import type { TSeoMeta } from '#/shared/transformers/to-seo-meta';

export type THomeHeroImage = {
  src: string;
  alt: string;
};

export type THomeHeroAction = {
  label: string;
  href: string;
};

export type THomeHero = {
  eyebrow: string | undefined;
  title: string;
  subtitle: string | undefined;
  image: THomeHeroImage | undefined;
  sanityImage: TSanityImage | undefined;
  primaryAction: THomeHeroAction | undefined;
  secondaryAction: THomeHeroAction | undefined;
};

export type THomePage = {
  hero: THomeHero;
  latestPostsTitle: string;
  latestPosts: TPostCard[];
  seo: TSeoMeta | undefined;
};
