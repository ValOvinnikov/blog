import type {
  ArticleText,
  Page_cookieStatement,
  Page_home,
  Page_postIndex,
  Settings_footer,
  Settings_navigation,
  Settings_site,
  Template_home,
  Template_postIndex,
} from '@blog/config/sanity/generated/types';

import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type TLocaleIsoCode,
} from '@blog/config/constants';

import { STARTER_COPY_BY_LOCALE, type TStarterCopy } from './copy/starter-copy';
import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterPage,
} from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { pageHeadingBlock, paragraphs, reference, seo } from './starter-fields';

// TODO(#5684): seed the tenant's own currency once tenants record one.
const DEFAULT_SITE_CURRENCY = 'USD';

type TStarterTemplateLayout<TTemplate extends Template_home> = Pick<
  TTemplate,
  'hero' | 'modules'
>;

const COOKIE_PREFERENCES_MARK_KEY = 'cookiePreferences';

function cookieStatementDocumentId(locale: TLocaleIsoCode): string {
  return `${STARTER_DOCUMENT_IDS.COOKIE_STATEMENT_PREFIX}.${locale}`;
}

function cookieStatementContent({
  intro,
  listIntro,
  preferencesLead,
  preferencesLink,
  preferencesTail,
}: TStarterCopy['cookieStatement']): ArticleText {
  return [
    ...paragraphs([intro, listIntro]),
    {
      _type: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
      _key: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST,
    },
    {
      _type: 'block',
      _key: 'preferences',
      style: 'normal',
      markDefs: [
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_PREFERENCES_LINK,
          _key: COOKIE_PREFERENCES_MARK_KEY,
        },
      ],
      children: [
        { _type: 'span', _key: 'lead', text: preferencesLead, marks: [] },
        {
          _type: 'span',
          _key: 'link',
          text: preferencesLink,
          marks: [COOKIE_PREFERENCES_MARK_KEY],
        },
        { _type: 'span', _key: 'tail', text: preferencesTail, marks: [] },
      ],
    },
  ];
}

function buildCookieStatementDocument(
  locale: TLocaleIsoCode,
): TStarterDocument<Page_cookieStatement, 'title' | 'content' | 'seo'> {
  const copy = STARTER_COPY_BY_LOCALE[locale].cookieStatement;

  return {
    _id: cookieStatementDocumentId(locale),
    _type: 'page_cookieStatement',
    language: locale,
    title: copy.title,
    content: cookieStatementContent(copy),
    seo: seo(copy.metaTitle, copy.metaDescription),
  };
}

export type TBaseDocumentsInput = {
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
  navigationItems?: Settings_navigation['items'];
  homeLayout?: TStarterTemplateLayout<Template_home>;
  postIndexModules?: Template_postIndex['modules'];
};

export function buildBaseDocuments({
  locale,
  copy: { home, postIndex },
  navigationItems = [],
  homeLayout,
  postIndexModules,
}: TBaseDocumentsInput): TStarterDocumentUnion[] {
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
    } satisfies TStarterDocument<Settings_site, 'title'>,
    {
      _id: STARTER_DOCUMENT_IDS.HOME_TEMPLATE,
      _type: 'template_home',
      title: 'Home Template',
      ...homeLayout,
    } satisfies TStarterDocument<Template_home, 'title'>,
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
    } satisfies TStarterDocument<Template_postIndex, 'title'>,
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
    buildCookieStatementDocument(locale),
  ];
}
