import type {
  THeadingBlock,
  TMaybeUndefined,
  TPagePostIndexType,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TBlogIndexPage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPagePostIndexType>>;
  modules: TModule<TPagePostIndexType>[];
  seo: TSeoResolved;
};
