import type { TModuleRef } from '#/shared/transformers/to-module-ref';
import type { TSeoMeta } from '#/shared/transformers/to-seo-meta';

export type THomePage = {
  title: string;
  hero: TModuleRef;
  modules: TModuleRef[];
  seo: TSeoMeta | undefined;
};
