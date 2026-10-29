import type {
  TBrandVariant,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
} from '@blog/config';

export type TCookieSettingsModule = {
  brandVariant: TBrandVariant;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  layout: TMaybeUndefined<TLayout>;
};
