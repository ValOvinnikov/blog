import type {
  TMaybeUndefined,
  THeadingBlock,
  TPageHomeType,
} from '@blog/config';
import type { TModule } from '@blog/service/shared/transformers/module/to-module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo/resolve-seo';

export type THomePage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageHomeType>>;
  modules: TModule<TPageHomeType>[];
  seo: TSeoResolved;
};
