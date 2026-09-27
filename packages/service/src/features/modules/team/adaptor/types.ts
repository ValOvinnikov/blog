import type {
  ISanityImage,
  TBrandVariantOf,
  TCardImageShape,
  TContentAlignment,
  TDisplayMode,
  THeadingBlock,
  TLayout,
  TMaybeUndefined,
  TPortableTextBlock,
} from '@blog/config';
import type { TCtaButton } from '@blog/service/shared/transformers/cta/to-cta-button';
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
  brandVariant: TBrandVariantOf<'PRIMARY' | 'SECONDARY'>;
  headingBlock: THeadingBlock;
  members: TTeamMember[];
  showBios: boolean;
  showSocialLinks: boolean;
  imageShape: Extract<TCardImageShape, 'CIRCLE' | 'SQUARE'>;
  displayMode: TDisplayMode;
  cardAlignment: Extract<TContentAlignment, 'LEFT' | 'CENTER'>;
  ctaButtons: TCtaButton[];
  contentAlignment: TMaybeUndefined<TContentAlignment>;
  layout: TMaybeUndefined<TLayout>;
};
