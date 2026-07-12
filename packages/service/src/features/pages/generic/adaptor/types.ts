import type { TModuleRef } from '#/shared/transformers/to-module-ref';
import type { TSeoMeta } from '#/shared/transformers/to-seo-meta';

export type TGenericPage = {
  title: string;
  slug: string;
  modules: TModuleRef[];
  seo: TSeoMeta | undefined;
};
