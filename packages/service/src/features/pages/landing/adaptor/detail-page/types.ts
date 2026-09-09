import type { THeadingBlock, THeroModuleType } from '@blog/config';
import type { TSeoResolved } from '@blog/service/shared/transformers/resolve-seo';
import type { TModule } from '@blog/service/shared/transformers/to-module';

export type TLandingPage = {
  // Studio's internal document label — an SEO fallback only; never render it
  // as page content, that is what `headingBlock` is for.
  documentTitle: string;
  slug: string;
  headingBlock: THeadingBlock;
  hero?: TModule<THeroModuleType>;
  modules: TModule[];
  seo: TSeoResolved;
};
