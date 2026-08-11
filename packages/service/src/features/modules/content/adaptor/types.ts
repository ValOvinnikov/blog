import type {
  RichText,
  TAppearance,
  TBrandVariantOf,
  TMaybeUndefined,
} from '@blog/config';

export type TContentModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  title: string;
  body: RichText;
  appearance: TMaybeUndefined<TAppearance>;
};
