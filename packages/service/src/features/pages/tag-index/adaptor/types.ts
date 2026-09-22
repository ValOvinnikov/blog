import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTagIndexType,
} from '@blog/config';
import type { TModule } from '@blog/service/shared/transformers/module/to-module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo/resolve-seo';

export type TTagIndexPage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageTagIndexType>>;
  modules: TModule<TPageTagIndexType>[];
  seo: TSeoResolved;
};
