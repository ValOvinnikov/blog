import type { TModule } from '@blog/service/shared/transformers/to-module';
import type { TSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';

export type THomePage = {
  title: string;
  hero: TModule;
  modules: TModule[];
  seo: TSeoMeta | undefined;
};
