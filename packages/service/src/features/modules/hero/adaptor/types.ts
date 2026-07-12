import type { ILink, ISanityImage } from '@blog/config';

export type THeroModuleImage = {
  src: string;
  alt: string;
};

export type THeroModule = {
  eyebrow: string | undefined;
  title: string | undefined;
  subtitle: string | undefined;
  image: THeroModuleImage | undefined;
  sanityImage: ISanityImage | undefined;
  primaryAction: ILink | undefined;
  secondaryAction: ILink | undefined;
};
