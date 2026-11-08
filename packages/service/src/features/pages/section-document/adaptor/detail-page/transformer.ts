import { toPageTranslations } from '@blog/service/shared/localization/page-translations/to-page-translations';
import { toPortableTextBody } from '@blog/service/shared/transformers/portable-text/to-portable-text-body';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { sectionDocumentPageQuery } from './query';
import type { TSectionDocumentDetail } from './types';

export type TRawSectionDocumentDetail = NonNullable<
  InferResultType<typeof sectionDocumentPageQuery>
>;

export function toSectionDocumentDetail(
  raw: TRawSectionDocumentDetail,
): TSectionDocumentDetail {
  return {
    id: raw._id,
    type: raw._type,
    title: raw.title,
    slug: raw.slug,
    kind: raw.kind,
    body: toPortableTextBody(raw.body),
    seo: resolveSeo(raw.seo),
    translations: toPageTranslations(raw.translations),
  };
}
