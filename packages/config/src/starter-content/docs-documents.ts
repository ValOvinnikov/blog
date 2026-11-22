import type { TLocaleIsoCode } from '@shinefold/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { buildFaqModule } from './starter-faq';
import { moduleSlot, paragraphs, reference } from './starter-fields';
import { internalLink, navigationLink } from './starter-links';
import {
  INTRODUCTION_MODULE_TITLE,
  QUESTIONS_MODULE_TITLE,
} from './starter-module-titles';
import { buildContentModule } from './starter-modules';
import { buildSectionPages } from './starter-section-pages';
import { buildStatementHero } from './starter-statement-hero';

const ids = STARTER_DOCUMENT_IDS;

export function buildDocsDocuments({
  locale,
  copy,
}: {
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
}): TStarterDocumentUnion[] {
  const { hero, intro, faq, guides, pages } = copy.docs;

  return [
    ...buildBaseDocuments({
      locale,
      copy,
      navigationItems: [navigationLink(ids.DOCS_GUIDES_LINK)],
      homeLayout: {
        hero: reference(ids.DOCS_HERO),
        modules: [
          moduleSlot(ids.DOCS_INTRO, 'module_content'),
          moduleSlot(ids.DOCS_FAQ, 'module_faq'),
        ],
      },
    }),
    buildStatementHero({
      id: ids.DOCS_HERO,
      locale,
      hero,
      linkId: ids.DOCS_GUIDES_LINK,
    }),
    buildContentModule({
      id: ids.DOCS_INTRO,
      title: INTRODUCTION_MODULE_TITLE,
      locale,
      body: paragraphs(intro.body),
    }),
    ...buildFaqModule({
      id: ids.DOCS_FAQ,
      title: QUESTIONS_MODULE_TITLE,
      locale,
      faq,
    }),
    internalLink(ids.DOCS_GUIDES_LINK, guides.title, locale, ids.DOCS_GUIDES),
    ...buildSectionPages({
      locale,
      name: 'Guides',
      ids: {
        page: ids.DOCS_GUIDES,
        template: ids.DOCS_GUIDES_TEMPLATE,
        list: ids.DOCS_GUIDES_LIST,
        childPrefix: ids.DOCS_GUIDE_PREFIX,
      },
      section: guides,
      pages,
      hasSectionNavigation: true,
    }),
  ];
}
