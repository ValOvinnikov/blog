import type {
  TMaybeUndefined,
  THeadingBlock,
  TPageHomeType,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type THomePage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageHomeType>>;
  modules: TModule<TPageHomeType>[];
  seo: TSeoResolved;
};
