import type {
  THeadingAlignment,
  THeadingBlock,
  TMaybeUndefined,
  TPageTagType,
} from '@shinefold/config';
import type { TPageTranslation } from '@shinefold/service/shared/localization/page-translations/to-page-translations';
import type { TModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';

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
