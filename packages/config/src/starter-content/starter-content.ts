import {
  SITE_TYPE,
  type TLocaleIsoCode,
  type TSiteType,
} from '@blog/config/constants';

import { buildBaseDocuments } from './base-documents';
import { buildBlogDocuments } from './blog-documents';
import { STARTER_COPY_BY_LOCALE } from './copy/starter-copy';
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
  [SITE_TYPE.BLANK]: ({ siteName, locale }: TStarterInput) =>
    buildBaseDocuments({
      siteName,
      locale,
      copy: STARTER_COPY_BY_LOCALE[locale],
    }),
} satisfies Partial<
  Record<TSiteType, (input: TStarterInput) => TStarterDocumentUnion[]>
>;

type TStarterSiteType = keyof typeof BUILD_BY_SITE_TYPE;

export function buildStarterDocuments({
  siteType,
  ...input
}: TStarterInput & { siteType: TStarterSiteType }): TStarterDocumentUnion[] {
  return BUILD_BY_SITE_TYPE[siteType](input);
}
