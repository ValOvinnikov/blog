import type { TModule } from '@blog/service/shared/transformers/to-module';
import type { TSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';

export type TGenericPage = {
  title: string;
  slug: string;
  modules: TModule[];
  seo: TSeoMeta | undefined;
};
