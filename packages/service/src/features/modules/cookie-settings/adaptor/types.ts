import type {
  TBrandVariant,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
} from '@shinefold/config';

export type TCookieSettingsModule = {
  brandVariant: TBrandVariant;
  headingBlock: TMaybeUndefined<THeadingBlock>;
  layout: TMaybeUndefined<TLayout>;
};
