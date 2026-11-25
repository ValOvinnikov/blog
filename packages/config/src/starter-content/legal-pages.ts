import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import type {
  ArticleText,
  Page_legalIndex,
  Page_privacyIndex,
  Template_legalIndex,
  Template_privacyIndex,
} from '@shinefold/config/sanity/generated/types';

import {
  buildCookieStatementDocument,
  cookieStatementDocumentId,
} from './cookie-statement-document';
import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion, TStarterPage } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import type { TStarterTemplate } from './starter-document-shape';
import { moduleSlot, reference } from './starter-fields';
import { linkedParagraph } from './starter-linked-paragraph';
import { internalLink } from './starter-links';
import { INTRODUCTION_MODULE_TITLE } from './starter-module-titles';
import { buildContentModule } from './starter-modules';
import { pageFields, starterTemplate } from './starter-pages';
import { paragraphs } from './starter-portable-text';

const COOKIE_STATEMENT_LINK_MARK_KEY = 'cookieStatementLink';

function legalIndexIntro(intro: string, cookieStatementTitle: string) {
  return [
    ...paragraphs([intro]),
    {
      ...linkedParagraph(
        'cookieStatement',
        {
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          _key: COOKIE_STATEMENT_LINK_MARK_KEY,
          link: reference(STARTER_DOCUMENT_IDS.COOKIE_STATEMENT_LINK),
        },
        { link: cookieStatementTitle },
      ),
      listItem: 'bullet',
      level: 1,
    },
  ] satisfies ArticleText;
}

export function buildLegalPages(
  locale: TLocaleIsoCode,
  { cookieStatement, privacyIndex, legalIndex }: TStarterCopy,
): TStarterDocumentUnion[] {
  return [
    buildCookieStatementDocument(locale, cookieStatement),
    starterTemplate(
      STARTER_DOCUMENT_IDS.PRIVACY_INDEX_TEMPLATE,
      'template_privacyIndex',
      'Privacy Index Template',
    ) satisfies TStarterTemplate<Template_privacyIndex>,
    {
      _id: STARTER_DOCUMENT_IDS.PRIVACY_INDEX,
      _type: 'page_privacyIndex',
      ...pageFields(
        locale,
        STARTER_DOCUMENT_IDS.PRIVACY_INDEX_TEMPLATE,
        privacyIndex,
      ),
    } satisfies TStarterPage<Page_privacyIndex>,
    internalLink(
      STARTER_DOCUMENT_IDS.COOKIE_STATEMENT_LINK,
      cookieStatement.title,
      locale,
      cookieStatementDocumentId(locale),
    ),
    buildContentModule({
      id: STARTER_DOCUMENT_IDS.LEGAL_INDEX_INTRO,
      title: INTRODUCTION_MODULE_TITLE,
      locale,
      body: legalIndexIntro(legalIndex.intro, cookieStatement.title),
    }),
    {
      ...starterTemplate(
        STARTER_DOCUMENT_IDS.LEGAL_INDEX_TEMPLATE,
        'template_legalIndex',
        'Legal Index Template',
      ),
      modules: [
        moduleSlot(STARTER_DOCUMENT_IDS.LEGAL_INDEX_INTRO, 'module_content'),
      ],
    } satisfies TStarterTemplate<Template_legalIndex>,
    {
      _id: STARTER_DOCUMENT_IDS.LEGAL_INDEX,
      _type: 'page_legalIndex',
      ...pageFields(
        locale,
        STARTER_DOCUMENT_IDS.LEGAL_INDEX_TEMPLATE,
        legalIndex,
      ),
    } satisfies TStarterPage<Page_legalIndex>,
  ];
}
