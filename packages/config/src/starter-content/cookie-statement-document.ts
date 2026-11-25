import {
  PORTABLE_TEXT_BLOCK_TYPE,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import type {
  ArticleText,
  Page_cookieStatement,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterCopy } from './copy/starter-copy';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import type { TStarterDocument } from './starter-document-shape';
import { pageHeadingBlock, paragraphs, seo } from './starter-fields';
import { linkedParagraph } from './starter-linked-paragraph';

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
    linkedParagraph(
      'preferences',
      {
        _type: PORTABLE_TEXT_BLOCK_TYPE.COOKIE_PREFERENCES_LINK,
        _key: COOKIE_PREFERENCES_MARK_KEY,
      },
      { lead: preferencesLead, link: preferencesLink, tail: preferencesTail },
    ),
  ];
}

export function buildCookieStatementDocument(
  locale: TLocaleIsoCode,
  cookieStatement: TStarterCopy['cookieStatement'],
): TStarterDocument<
  Page_cookieStatement,
  'title' | 'headingBlock' | 'content' | 'seo'
> {
  return {
    _id: cookieStatementDocumentId(locale),
    _type: 'page_cookieStatement',
    language: locale,
    title: cookieStatement.title,
    headingBlock: pageHeadingBlock(
      cookieStatement.heading,
      cookieStatement.supportingText,
    ),
    content: cookieStatementContent(cookieStatement),
    seo: seo(cookieStatement.metaTitle, cookieStatement.metaDescription),
  };
}
