import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toHeadingBlock } from '@blog/service/shared/transformers/to-heading-block';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/to-module';
import type { InferResultType } from 'groqd';

import type { landingPageQuery } from './query';
import type { TLandingPage } from './types';

export type TRawLandingPage = NonNullable<
  InferResultType<typeof landingPageQuery>
>;

export function toLandingPage(
  raw: TRawLandingPage,
  settings: TSiteSettings,
  tenant: TImageTenant,
): TLandingPage {
  return {
    documentTitle: raw.title,
    slug: raw.slug,
    headingBlock: toHeadingBlock(raw.headingBlock),
    hero: raw.hero ? toHeroSlot(raw.hero) : undefined,
    modules: (raw.modules ?? []).map(toModule),
    // The page_landing schema has no excerpt/summary or image field, so the
    // content-derived tier only supplies a title; description/image fall
    // through to the site defaults.
    seo: resolveSeo(
      raw.seo ?? undefined,
      { title: raw.title },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
      tenant,
    ),
  };
}
