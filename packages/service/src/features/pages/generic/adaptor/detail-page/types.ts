import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TGenericPage = {
  title: string;
  slug: string;
  modules: TModule[];
  seo: TSeoResolved;
};
