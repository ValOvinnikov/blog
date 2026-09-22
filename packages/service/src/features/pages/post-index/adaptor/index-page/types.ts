import type {
  THeadingBlock,
  TMaybeUndefined,
  TPagePostIndexType,
} from '@blog/config';
import type { TModule } from '@blog/service/shared/transformers/module/to-module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo/resolve-seo';

export type TBlogIndexPage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPagePostIndexType>>;
  modules: TModule<TPagePostIndexType>[];
  seo: TSeoResolved;
};
