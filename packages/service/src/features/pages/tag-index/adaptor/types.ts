import type {
  THeadingBlock,
  THeroModuleType,
  TMaybeUndefined,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TTagIndexPage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<THeroModuleType>>;
  modules: TModule[];
  seo: TSeoResolved;
};
