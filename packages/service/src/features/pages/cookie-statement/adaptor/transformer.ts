import type { TLocaleIsoCode } from '@blog/config/constants';
import { toPageLanguages } from '@blog/service/shared/localization/page-languages/to-page-languages';
import { toHeadingAlignment } from '@blog/service/shared/transformers/heading-block/to-heading-alignment';
import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toPortableTextBody } from '@blog/service/shared/transformers/portable-text/to-portable-text-body';
import { resolveSeo } from '@blog/service/shared/transformers/seo/resolve-seo';
import type { InferResultType } from 'groqd';

import type { cookieStatementPageQuery } from './query';
import type { TCookieStatementPage } from './types';

export type TRawCookieStatementPage = NonNullable<
  InferResultType<typeof cookieStatementPageQuery>
>;

export function toCookieStatementPage(
  raw: TRawCookieStatementPage,
  defaultLocale: TLocaleIsoCode,
): TCookieStatementPage {
  const {
    _id,
    title,
    headingBlock,
    contentAlignment,
    body,
    seo,
    translations,
  } = raw;

  return {
    id: _id,
    title,
    headingBlock: toHeadingBlock(headingBlock),
    headingAlignment: toHeadingAlignment(contentAlignment),
    body: toPortableTextBody(body),
    seo: resolveSeo(seo),
    translations: toPageLanguages(translations, defaultLocale),
  };
}
