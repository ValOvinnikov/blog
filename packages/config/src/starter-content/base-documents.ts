import { PRICE_PERIOD, type TLocaleIsoCode } from '@shinefold/config/constants';
import type {
  Page_home,
  Page_postIndex,
  Settings_footer,
  Settings_navigation,
  Settings_site,
  Template_home,
  Template_postIndex,
} from '@shinefold/config/sanity/generated/types';
import { SITE_MESSAGES_BY_LOCALE } from '@shinefold/config/voice';

import type { TStarterCopy } from './copy/starter-copy';
import { buildLegalPages } from './legal-pages';
import type { TStarterDocumentUnion, TStarterPage } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import type {
  TStarterDocument,
  TStarterTemplate,
} from './starter-document-shape';
import {
  localizedString,
  pageHeadingBlock,
  reference,
  seo,
} from './starter-fields';

// TODO(#5684): seed the tenant's own currency once tenants record one.
const DEFAULT_SITE_CURRENCY = 'USD';

function pricePeriodWording(locale: TLocaleIsoCode) {
  const { period } = SITE_MESSAGES_BY_LOCALE[locale].pricingModule;

  return {
    [PRICE_PERIOD.ONE_TIME]: localizedString(locale, period.ONE_TIME),
    [PRICE_PERIOD.HOUR]: localizedString(locale, period.HOUR),
    [PRICE_PERIOD.SESSION]: localizedString(locale, period.SESSION),
    [PRICE_PERIOD.MONTH]: localizedString(locale, period.MONTH),
    [PRICE_PERIOD.YEAR]: localizedString(locale, period.YEAR),
  };
}

type TStarterHomeLayout = Pick<
  TStarterTemplate<Template_home>,
  'hero' | 'modules'
>;

export type TBaseDocumentsInput = {
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
  navigationItems?: Settings_navigation['items'];
  homeLayout?: TStarterHomeLayout;
  postIndexModules?: TStarterTemplate<Template_postIndex>['modules'];
};

export function buildBaseDocuments({
  locale,
  copy,
  navigationItems = [],
  homeLayout,
  postIndexModules,
}: TBaseDocumentsInput): TStarterDocumentUnion[] {
  const { home, postIndex } = copy;

  return [
    {
      _id: STARTER_DOCUMENT_IDS.NAVIGATION,
      _type: 'settings_navigation',
      title: 'Primary Navigation',
      items: navigationItems,
    } satisfies TStarterDocument<Settings_navigation, 'title'>,
    {
      _id: STARTER_DOCUMENT_IDS.FOOTER,
      _type: 'settings_footer',
      title: 'Footer',
    } satisfies TStarterDocument<Settings_footer, 'title'>,
    {
      _id: STARTER_DOCUMENT_IDS.SITE,
      _type: 'settings_site',
      title: 'Site Settings',
      currency: DEFAULT_SITE_CURRENCY,
      pricePeriodSuffix: pricePeriodWording(locale),
    } satisfies TStarterDocument<Settings_site, 'title'>,
    {
      _id: STARTER_DOCUMENT_IDS.HOME_TEMPLATE,
      _type: 'template_home',
      title: 'Home Template',
      ...homeLayout,
    } satisfies TStarterTemplate<Template_home>,
    {
      _id: STARTER_DOCUMENT_IDS.HOME,
      _type: 'page_home',
      language: locale,
      title: home.title,
      headingBlock: pageHeadingBlock(home.heading, home.supportingText),
      template: reference(STARTER_DOCUMENT_IDS.HOME_TEMPLATE),
      seo: seo(home.metaTitle, home.metaDescription),
    } satisfies TStarterPage<Page_home>,
    {
      _id: STARTER_DOCUMENT_IDS.POST_INDEX_TEMPLATE,
      _type: 'template_postIndex',
      title: 'Post Index Template',
      ...(postIndexModules && { modules: postIndexModules }),
    } satisfies TStarterTemplate<Template_postIndex>,
    {
      _id: STARTER_DOCUMENT_IDS.POST_INDEX,
      _type: 'page_postIndex',
      language: locale,
      title: postIndex.title,
      headingBlock: pageHeadingBlock(
        postIndex.heading,
        postIndex.supportingText,
      ),
      template: reference(STARTER_DOCUMENT_IDS.POST_INDEX_TEMPLATE),
      seo: seo(postIndex.metaTitle, postIndex.metaDescription),
    } satisfies TStarterPage<Page_postIndex>,
    ...buildLegalPages(locale, copy),
  ];
}
