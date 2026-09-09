import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import type { TImageTenant } from '@blog/service/sanity/image';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import {
  toHeroSlot,
  toModule,
} from '@blog/service/shared/transformers/to-module';
import { toSectionHeader } from '@blog/service/shared/transformers/to-section-header';
import type { InferResultType } from 'groqd';

import type { homePageQuery } from './query';
import type { THomePage } from './types';

export type TRawHomePage = NonNullable<InferResultType<typeof homePageQuery>>;

export function toHomePage(
  raw: TRawHomePage,
  settings: TSiteSettings,
  tenant: TImageTenant,
): THomePage {
  const header = raw.sectionHeader
    ? toSectionHeader(raw.sectionHeader)
    : { heading: undefined, supportingText: undefined };

  return {
    title: raw.title,
    heading: header.heading,
    supportingText: header.supportingText,
    hero: raw.hero ? toHeroSlot(raw.hero) : undefined,
    modules: (raw.modules ?? []).map(toModule),
    seo: resolveSeo(
      raw.seo ?? undefined,
      { title: settings.brand.name },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
      tenant,
    ),
  };
}
