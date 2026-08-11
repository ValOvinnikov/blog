import type {
  RichText,
  TAppearance,
  TBrandVariant,
  TMaybeUndefined,
} from '@blog/config';

export type TContentModule = {
  brandVariant: TBrandVariant;
  title: string;
  body: RichText;
  appearance: TMaybeUndefined<TAppearance>;
};
