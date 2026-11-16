import type {
  THeadingAlignment,
  THeadingBlock,
  TMaybeUndefined,
  TPageTagIndexType,
} from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';

export type TTagIndexPage = {
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPageTagIndexType>>;
  modules: TModule<TPageTagIndexType>[];
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
