import type { ISanityImage, TMaybeUndefined } from '@shinefold/config';

export type TSectionPageCard = {
  id: string;
  title: string;
  summary: TMaybeUndefined<string>;
  image: TMaybeUndefined<ISanityImage>;
  path: string;
};
