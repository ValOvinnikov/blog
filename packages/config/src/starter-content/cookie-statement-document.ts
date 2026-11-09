import type {
  ArticleText,
  Page_cookieStatement,
} from '@blog/config/sanity/generated/types';

import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type TLocaleIsoCode,
} from '@blog/config/constants';

import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocument } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { paragraphs, seo } from './starter-fields';

const COOKIE_PREFERENCES_MARK_KEY = 'cookiePreferences';

export function cookieStatementDocumentId(locale: TLocaleIsoCode): string {
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

export function buildCookieStatementDocument(
  locale: TLocaleIsoCode,
  cookieStatement: TStarterCopy['cookieStatement'],
): TStarterDocument<Page_cookieStatement, 'title' | 'content' | 'seo'> {
  return {
    _id: cookieStatementDocumentId(locale),
    _type: 'page_cookieStatement',
    language: locale,
    title: cookieStatement.title,
    content: cookieStatementContent(cookieStatement),
    seo: seo(cookieStatement.metaTitle, cookieStatement.metaDescription),
  };
}
