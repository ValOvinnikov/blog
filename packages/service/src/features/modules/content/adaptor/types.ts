import type {
  TBrandVariantOf,
  TLayout,
  TMaybeUndefined,
  TPortableTextBody,
} from '@blog/config';

export type TContentModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  body: TPortableTextBody;
  layout: TMaybeUndefined<TLayout>;
};
