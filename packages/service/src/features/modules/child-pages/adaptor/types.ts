import type {
  ISanityImage,
  TBrandVariantOf,
  TContentAlignment,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TChildPageCard = {
  id: string;
  title: string;
  summary: TMaybeUndefined<string>;
  image: TMaybeUndefined<ISanityImage>;
  path: string;
};

export type TChildPagesModule = {
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  pages: TChildPageCard[];
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TLayout>;
};
