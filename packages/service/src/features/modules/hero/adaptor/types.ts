import type { ILink, ISanityImage, TMaybeUndefined } from '@blog/config';

export type THeroModuleImage = {
  src: string;
  alt: string;
};

export type THeroModule = {
  eyebrow: TMaybeUndefined<string>;
  title: TMaybeUndefined<string>;
  subtitle: TMaybeUndefined<string>;
  image: TMaybeUndefined<THeroModuleImage>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  primaryAction: TMaybeUndefined<ILink>;
  secondaryAction: TMaybeUndefined<ILink>;
};
