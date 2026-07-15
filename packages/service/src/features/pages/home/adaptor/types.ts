import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type THomePage = {
  title: string;
  hero: TModule;
  modules: TModule[];
  seo: TSeoResolved;
};
