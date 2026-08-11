import type {
  ILink,
  TAppearance,
  TBrandVariantOf,
  TMaybeUndefined,
} from '@blog/config';

export type TCtaModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  heading: string;
  text: TMaybeUndefined<string>;
  action: TMaybeUndefined<ILink>;
  appearance: TMaybeUndefined<TAppearance>;
};
