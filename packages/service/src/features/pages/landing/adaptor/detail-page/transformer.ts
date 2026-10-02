import { isLocaleIsoCode } from '@blog/config/constants';
import { resolveFaqs } from '@blog/service/shared/transformers/faq/resolve-faqs';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/module/to-module';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { landingPageQuery } from './query';
import type { TLandingPage, TLandingTranslation } from './types';

export type TRawLandingPage = NonNullable<
  InferResultType<typeof landingPageQuery>
>;

function toTranslations(
  translations: TRawLandingPage['translations'],
): TLandingTranslation[] {
  return (translations ?? []).flatMap(({ language, slug }) =>
    language && slug && isLocaleIsoCode(language) ? [{ language, slug }] : [],
  );
}

export function toLandingPage(raw: TRawLandingPage): TLandingPage {
  return {
    slug: raw.slug,
    headingBlock: toHeadingBlock(raw.headingBlock),
    hero: toHeroSlot(raw.hero),
    modules: (raw.modules ?? []).map(toModule),
    faqs: resolveFaqs(raw.faqs),
    seo: resolveSeo(raw.seo),
    translations: toTranslations(raw.translations),
  };
}
