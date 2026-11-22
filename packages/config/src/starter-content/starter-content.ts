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
import { STARTER_COPY_BY_LOCALE } from './copy/starter-copy';
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
  [SITE_TYPE.BLOG]: (input: TStarterInput) =>
    buildBlogDocuments({
      ...input,
      copy: STARTER_COPY_BY_LOCALE[input.locale],
    }),
  [SITE_TYPE.PORTFOLIO]: ({ siteName, locale }: TStarterInput) =>
    buildPortfolioDocuments({
      siteName,
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
    }),
  [SITE_TYPE.PERSONAL]: ({ siteName, locale }: TStarterInput) =>
    buildPersonalDocuments({
      siteName,
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
    }),
  [SITE_TYPE.DOCS]: ({ locale }: TStarterInput) =>
    buildDocsDocuments({
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
    }),
  [SITE_TYPE.BUSINESS]: ({ locale }: TStarterInput) =>
    buildBusinessDocuments({
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
    }),
  [SITE_TYPE.PRODUCT]: ({ locale }: TStarterInput) =>
    buildProductDocuments({
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
    }),
  [SITE_TYPE.BLANK]: ({ locale }: TStarterInput) =>
    buildBaseDocuments({
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
    }),
} satisfies Record<
  TSiteType,
  (input: TStarterInput) => TStarterDocumentUnion[]
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
  return BUILD_BY_SITE_TYPE[siteType](input);
}

export function buildStarterCookieStatement(locale: TLocaleIsoCode) {
  return buildCookieStatementDocument(
    locale,
    STARTER_COPY_BY_LOCALE[locale].cookieStatement,
  );
}
