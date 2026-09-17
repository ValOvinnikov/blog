import type {
  TMaybeUndefined,
  THeadingBlock,
  TPageHomeModuleTypes,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type THomePage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageHomeModuleTypes['hero']>>;
  modules: TModule<TPageHomeModuleTypes['modules']>[];
  seo: TSeoResolved;
};
