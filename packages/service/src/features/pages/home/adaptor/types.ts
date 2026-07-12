import type { TModuleRef } from '@blog/service/shared/transformers/to-module-ref';
import type { TSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';

export type THomePage = {
  title: string;
  hero: TModuleRef;
  modules: TModuleRef[];
  seo: TSeoMeta | undefined;
};
