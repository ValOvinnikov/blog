import type { THeroModuleType } from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TLandingPage = {
  title: string;
  slug: string;
  hero?: TModule<THeroModuleType>;
  modules: TModule[];
  seo: TSeoResolved;
};
