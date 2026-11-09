import { toPageTranslations } from '@blog/service/shared/localization/page-translations/to-page-translations';
import { toHeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
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
  const {
    _id,
    _type,
    title,
    slug,
    kind,
    headingBlock,
    contentAlignment,
    body,
    seo,
    translations,
  } = raw;

  return {
    id: _id,
    type: _type,
    title,
    slug,
    kind,
    headingBlock: toHeadingBlock(headingBlock),
    headingAlignment: toHeadingAlignment(contentAlignment),
    body: toPortableTextBody(body),
    seo: resolveSeo(seo),
    translations: toPageTranslations(translations),
  };
}
