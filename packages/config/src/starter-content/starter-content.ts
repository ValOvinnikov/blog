import type { TMaybeNull } from '@blog/config/types';

import {
  PRESET_ID,
  SITE_TYPE,
  type TLocaleIsoCode,
  type TPresetId,
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

export type TStarterSiteType = keyof typeof BUILD_BY_SITE_TYPE;

export const STARTER_TEMPLATE_VERSION = 1;

export const STARTER_PRESET_BY_SITE_TYPE: Record<TStarterSiteType, TPresetId> =
  {
    [SITE_TYPE.BLOG]: PRESET_ID.EDITORIAL,
    [SITE_TYPE.BLANK]: PRESET_ID.CONSOLE,
  };

function isStarterSiteType(siteType: TSiteType): siteType is TStarterSiteType {
  return siteType in BUILD_BY_SITE_TYPE;
}

// A tenant with no site type, or one whose template isn't built yet, starts from the Blank site.
export function toStarterSiteType(
  siteType: TMaybeNull<TSiteType>,
): TStarterSiteType {
  return siteType !== null && isStarterSiteType(siteType)
    ? siteType
    : SITE_TYPE.BLANK;
}

export function buildStarterDocuments({
  siteType,
  ...input
}: TStarterInput & { siteType: TStarterSiteType }): TStarterDocumentUnion[] {
  return BUILD_BY_SITE_TYPE[siteType](input);
}
