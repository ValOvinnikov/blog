import type {
  RichText,
  TBrandVariantOf,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TContentModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  body: RichText;
  layout: TMaybeUndefined<TLayout>;
};
