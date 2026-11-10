import type {
  THeadingAlignment,
  THeadingBlock,
  TMaybeUndefined,
  TPageTagIndexType,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type TTagIndexPage = {
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPageTagIndexType>>;
  modules: TModule<TPageTagIndexType>[];
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
