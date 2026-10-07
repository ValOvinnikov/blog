import type {
  ISanityImage,
  TBrandVariant,
  TCardImageShape,
  TContentAlignment,
  TContentAlignmentOf,
  TDisplayMode,
  THeadingBlock,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
import type { TWideLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { TSocialProfile } from '@blog/service/shared/transformers/social-profile/to-social-profile';

export type TTeamMember = {
  id: string;
  name: string;
  image: TMaybeUndefined<ISanityImage>;
  role: TMaybeUndefined<string>;
  bio: TMaybeUndefined<TPortableTextBlock[]>;
  socialLinks: TSocialProfile[];
  profileUrl: TMaybeUndefined<string>;
};

export type TTeamModule = {
  brandVariant: TBrandVariant;
  headingBlock: THeadingBlock;
  members: TTeamMember[];
  showBios: boolean;
  showSocialLinks: boolean;
  imageShape: Extract<TCardImageShape, 'CIRCLE' | 'SQUARE'>;
  displayMode: TDisplayMode;
  cardAlignment: Extract<TContentAlignment, 'LEFT' | 'CENTER'>;
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignmentOf<'LEFT' | 'CENTER'>>;
  layout: TMaybeUndefined<TWideLayout>;
};
