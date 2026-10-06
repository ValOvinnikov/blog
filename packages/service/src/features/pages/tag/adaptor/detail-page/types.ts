import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTagType,
} from '@blog/config';
import type { TPageTranslation } from '@blog/service/shared/localization/page-translations/to-page-translations';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type TTagDetailPageTag = {
  id: string;
  title: string;
  slug: TMaybeUndefined<string>;
  description: TMaybeUndefined<string>;
};

export type TTagDetailPage = {
  tag: TTagDetailPageTag;
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageTagType>>;
  modules: TModule<TPageTagType>[];
  faqs: TFaqPageQuestion[];
  seo: TSeoResolved;
  translations: TPageTranslation[];
};
