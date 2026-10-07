import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTagType,
} from '@blog/config';
import type { TPageTranslation } from '@blog/service/shared/localization/page-translations/to-page-translations';
import type { THeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type TTagDetailPageTag = {
  id: string;
  title: string;
  slug: TMaybeUndefined<string>;
  description: TMaybeUndefined<string>;
};

export type TTagDetailPageDocument = {
  tag: TTagDetailPageTag;
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPageTagType>>;
  modules: TModule<TPageTagType>[];
  seo: TSeoResolved;
  translations: TPageTranslation[];
};
