import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageLandingType,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TLandingPage = {
  slug: string;
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageLandingType>>;
  modules: TModule<TPageLandingType>[];
  seo: TSeoResolved;
};
