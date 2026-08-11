import type {
  ILink,
  TAppearance,
  TBrandVariant,
  TMaybeUndefined,
} from '@blog/config';

export type TCtaModule = {
  brandVariant: TBrandVariant;
  heading: string;
  text: TMaybeUndefined<string>;
  action: TMaybeUndefined<ILink>;
  appearance: TMaybeUndefined<TAppearance>;
};
