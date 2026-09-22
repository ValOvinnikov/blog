import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageLandingType,
} from '@blog/config';
import type { TModule } from '@blog/service/shared/transformers/module/to-module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo/resolve-seo';

export type TLandingPage = {
  slug: string;
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageLandingType>>;
  modules: TModule<TPageLandingType>[];
  seo: TSeoResolved;
};
