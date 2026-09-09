import type { THeroModuleType, TMaybeUndefined } from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type THomePage = {
  title: string;
  heading: TMaybeUndefined<string>;
  supportingText: TMaybeUndefined<string>;
  hero: TMaybeUndefined<TModule<THeroModuleType>>;
  modules: TModule[];
  seo: TSeoResolved;
};
