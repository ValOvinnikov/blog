import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageTagIndexType,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TTagIndexPage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageTagIndexType>>;
  modules: TModule<TPageTagIndexType>[];
  seo: TSeoResolved;
};
