import type { TModuleRef } from '@blog/service/shared/transformers/to-module-ref';
import type { TSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';

export type TGenericPage = {
  title: string;
  slug: string;
  modules: TModuleRef[];
  seo: TSeoMeta | undefined;
};
