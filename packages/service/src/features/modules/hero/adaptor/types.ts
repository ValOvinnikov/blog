import type { ILink, ISanityImage, TMaybeUndefined } from '@blog/config';

export type THeroModule = {
  eyebrow: TMaybeUndefined<string>;
  title: TMaybeUndefined<string>;
  subtitle: TMaybeUndefined<string>;
  sanityImage: TMaybeUndefined<ISanityImage>;
  primaryAction: TMaybeUndefined<ILink>;
  secondaryAction: TMaybeUndefined<ILink>;
};
