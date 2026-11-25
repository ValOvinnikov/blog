import {
  PRESET_ID,
  SITE_TYPE,
  type TLocaleIsoCode,
  type TPresetId,
  type TSiteType,
} from '@shinefold/config/constants';
import type { TMaybeNull } from '@shinefold/config/types';

import { buildBaseDocuments } from './base-documents';
import { buildBlogDocuments } from './blog-documents';
import { buildBusinessDocuments } from './business-documents';
import { buildCookieStatementDocument } from './cookie-statement-document';
import { STARTER_COPY_BY_LOCALE, type TStarterCopy } from './copy/starter-copy';
import { buildDocsDocuments } from './docs-documents';
import { buildPersonalDocuments } from './personal-documents';
import { buildPortfolioDocuments } from './portfolio-documents';
import { buildProductDocuments } from './product-documents';
import type { TStarterDocumentUnion } from './starter-document';

type TStarterInput = {
  siteName: string;
  locale: TLocaleIsoCode;
  publishedAt: string;
};

const BUILD_BY_SITE_TYPE = {
  [SITE_TYPE.BLOG]: buildBlogDocuments,
  [SITE_TYPE.PORTFOLIO]: buildPortfolioDocuments,
  [SITE_TYPE.PERSONAL]: buildPersonalDocuments,
  [SITE_TYPE.DOCS]: buildDocsDocuments,
  [SITE_TYPE.BUSINESS]: buildBusinessDocuments,
  [SITE_TYPE.PRODUCT]: buildProductDocuments,
  [SITE_TYPE.BLANK]: buildBaseDocuments,
} satisfies Record<
  TSiteType,
  (input: TStarterInput & { copy: TStarterCopy }) => TStarterDocumentUnion[]
>;

export type TStarterSiteType = keyof typeof BUILD_BY_SITE_TYPE;

export const STARTER_TEMPLATE_VERSION = 1;

export const STARTER_PRESET_BY_SITE_TYPE: Record<TStarterSiteType, TPresetId> =
  {
    [SITE_TYPE.BLOG]: PRESET_ID.EDITORIAL,
    [SITE_TYPE.PORTFOLIO]: PRESET_ID.EDITORIAL,
    [SITE_TYPE.PERSONAL]: PRESET_ID.EDITORIAL,
    [SITE_TYPE.DOCS]: PRESET_ID.CONSOLE,
    [SITE_TYPE.BUSINESS]: PRESET_ID.CONSOLE,
    [SITE_TYPE.PRODUCT]: PRESET_ID.CONSOLE,
    [SITE_TYPE.BLANK]: PRESET_ID.CONSOLE,
  };

export function toStarterSiteType(
  siteType: TMaybeNull<TSiteType>,
): TStarterSiteType {
  return siteType ?? SITE_TYPE.BLANK;
}

export function buildStarterDocuments({
  siteType,
  ...input
}: TStarterInput & { siteType: TStarterSiteType }): TStarterDocumentUnion[] {
  return BUILD_BY_SITE_TYPE[siteType]({
    ...input,
    copy: STARTER_COPY_BY_LOCALE[input.locale],
  });
}

export function buildStarterCookieStatement(locale: TLocaleIsoCode) {
  return buildCookieStatementDocument(
    locale,
    STARTER_COPY_BY_LOCALE[locale].cookieStatement,
  );
}
