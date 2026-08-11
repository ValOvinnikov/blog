import type {
  TAppearance,
  TBrandVariantOf,
  TMaybeUndefined,
} from '@blog/config';

export type TNewsletterModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  heading: string;
  description: TMaybeUndefined<string>;
  appearance: TMaybeUndefined<TAppearance>;
};
