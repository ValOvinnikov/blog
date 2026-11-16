import type {
  THeadingAlignment,
  THeadingBlock,
  TMaybeUndefined,
  TPageHomeType,
} from '@shinefold/config';
import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type { TModule } from '@shinefold/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@shinefold/service/shared/transformers/seo/resolve-seo';

export type THomePageDocument = {
  id: string;
  headingBlock: THeadingBlock;
  headingAlignment: THeadingAlignment;
  hero: TMaybeUndefined<TModule<TPageHomeType>>;
  modules: TModule<TPageHomeType>[];
  seo: TSeoResolved;
  translations: TLocaleIsoCode[];
};
