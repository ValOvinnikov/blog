import type { ILink, ISanityImage } from '@blog/config';

import type { TPostCard } from '#/shared/transformers/to-post-card';
import type { TSeoMeta } from '#/shared/transformers/to-seo-meta';

export type THomeHeroImage = {
  src: string;
  alt: string;
};

/** Hero actions are the shared link view-model (carries target for new-tab). */
export type THomeHeroAction = ILink;

export type THomeHero = {
  eyebrow: string | undefined;
  title: string;
  subtitle: string | undefined;
  image: THomeHeroImage | undefined;
  sanityImage: ISanityImage | undefined;
  primaryAction: THomeHeroAction | undefined;
  secondaryAction: THomeHeroAction | undefined;
};

export type THomePage = {
  hero: THomeHero;
  latestPostsTitle: string;
  latestPosts: TPostCard[];
  seo: TSeoMeta | undefined;
};
