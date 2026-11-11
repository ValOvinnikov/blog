import type {
  TBrandVariant,
  TContentAlignmentOf,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TParsedEmbed,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';

export type TEmbed = TParsedEmbed & {
  title: string;
  caption: TMaybeUndefined<string>;
};

export type TEmbedModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  embed: TMaybeUndefined<TEmbed>;
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TLayout>;
};
