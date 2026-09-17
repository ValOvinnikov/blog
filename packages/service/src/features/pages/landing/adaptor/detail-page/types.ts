import type {
  THeadingBlock,
  TMaybeUndefined,
  TPageLandingModuleTypes,
} from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TLandingPage = {
  slug: string;
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageLandingModuleTypes['hero']>>;
  modules: TModule<TPageLandingModuleTypes['modules']>[];
  seo: TSeoResolved;
};
