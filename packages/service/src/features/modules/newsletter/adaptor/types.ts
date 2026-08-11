import type { TAppearance, TBrandVariant, TMaybeUndefined } from '@blog/config';

export type TNewsletterModule = {
  brandVariant: TBrandVariant;
  heading: string;
  description: TMaybeUndefined<string>;
  appearance: TMaybeUndefined<TAppearance>;
};
