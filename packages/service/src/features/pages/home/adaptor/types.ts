import type {
  TMaybeUndefined,
  THeadingBlock,
  TPageHomeType,
} from '@blog/config';
import type { TFaqPageQuestion } from '@blog/service/shared/transformers/faq/resolve-faqs';
import type { TModule } from '@blog/service/shared/transformers/module/to-module';
import type { TSeoResolved } from '@blog/service/shared/transformers/seo/resolve-seo';

export type THomePage = {
  headingBlock: THeadingBlock;
  hero: TMaybeUndefined<TModule<TPageHomeType>>;
  modules: TModule<TPageHomeType>[];
  faqs: TFaqPageQuestion[];
  seo: TSeoResolved;
};
