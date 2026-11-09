import type {
  ArticleText,
  Page_legalIndex,
  Page_privacyIndex,
  Template_legalIndex,
  Template_privacyIndex,
} from '@blog/config/sanity/generated/types';

import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type TLocaleIsoCode,
} from '@blog/config/constants';

import {
  buildCookieStatementDocument,
  cookieStatementDocumentId,
} from './cookie-statement-document';
import type { TStarterCopy } from './copy/starter-copy';
import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterPage,
} from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import {
  keyedReference,
  pageHeadingBlock,
  paragraphs,
  reference,
  seo,
} from './starter-fields';
import { internalLink } from './starter-links';
import { buildContentModule } from './starter-modules';

const COOKIE_STATEMENT_LINK_MARK_KEY = 'cookieStatementLink';

function legalIndexIntro(intro: string, cookieStatementTitle: string) {
  return [
    ...paragraphs([intro]),
    {
      _type: 'block',
      _key: 'cookieStatement',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          _key: COOKIE_STATEMENT_LINK_MARK_KEY,
          link: reference(STARTER_DOCUMENT_IDS.COOKIE_STATEMENT_LINK),
        },
      ],
      children: [
        {
          _type: 'span',
          _key: 'link',
          text: cookieStatementTitle,
          marks: [COOKIE_STATEMENT_LINK_MARK_KEY],
        },
      ],
    },
  ] satisfies ArticleText;
}

export function buildLegalPages(
  locale: TLocaleIsoCode,
  { cookieStatement, privacyIndex, legalIndex }: TStarterCopy,
): TStarterDocumentUnion[] {
  return [
    buildCookieStatementDocument(locale, cookieStatement),
    {
      _id: STARTER_DOCUMENT_IDS.PRIVACY_INDEX_TEMPLATE,
      _type: 'template_privacyIndex',
      title: 'Privacy Index Template',
    } satisfies TStarterDocument<Template_privacyIndex, 'title'>,
    {
      _id: STARTER_DOCUMENT_IDS.PRIVACY_INDEX,
      _type: 'page_privacyIndex',
      language: locale,
      title: privacyIndex.title,
      headingBlock: pageHeadingBlock(
        privacyIndex.heading,
        privacyIndex.supportingText,
      ),
      template: reference(STARTER_DOCUMENT_IDS.PRIVACY_INDEX_TEMPLATE),
      seo: seo(privacyIndex.metaTitle, privacyIndex.metaDescription),
    } satisfies TStarterPage<Page_privacyIndex>,
    internalLink(
      STARTER_DOCUMENT_IDS.COOKIE_STATEMENT_LINK,
      cookieStatement.title,
      locale,
      cookieStatementDocumentId(locale),
    ),
    buildContentModule({
      id: STARTER_DOCUMENT_IDS.LEGAL_INDEX_INTRO,
      title: 'Introduction',
      locale,
      body: legalIndexIntro(legalIndex.intro, cookieStatement.title),
    }),
    {
      _id: STARTER_DOCUMENT_IDS.LEGAL_INDEX_TEMPLATE,
      _type: 'template_legalIndex',
      title: 'Legal Index Template',
      modules: [keyedReference(STARTER_DOCUMENT_IDS.LEGAL_INDEX_INTRO)],
    } satisfies TStarterDocument<Template_legalIndex, 'title'>,
    {
      _id: STARTER_DOCUMENT_IDS.LEGAL_INDEX,
      _type: 'page_legalIndex',
      language: locale,
      title: legalIndex.title,
      headingBlock: pageHeadingBlock(
        legalIndex.heading,
        legalIndex.supportingText,
      ),
      template: reference(STARTER_DOCUMENT_IDS.LEGAL_INDEX_TEMPLATE),
      seo: seo(legalIndex.metaTitle, legalIndex.metaDescription),
    } satisfies TStarterPage<Page_legalIndex>,
  ];
}
