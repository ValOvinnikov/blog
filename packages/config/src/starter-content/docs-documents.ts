import type { TLocaleIsoCode } from '@shinefold/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { reference } from './starter-fields';
import { buildHomeSections } from './starter-home-sections';
import { internalLink, navigationLink } from './starter-links';
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

  const homeSections = buildHomeSections({
    locale,
    intro: { id: ids.DOCS_INTRO, ...intro },
    faq: { id: ids.DOCS_FAQ, ...faq },
  });

  return [
    ...buildBaseDocuments({
      locale,
      copy,
      navigationItems: [navigationLink(ids.DOCS_GUIDES_LINK)],
      homeLayout: {
        hero: reference(ids.DOCS_HERO),
        modules: homeSections.modules,
      },
    }),
    buildStatementHero({
      id: ids.DOCS_HERO,
      locale,
      hero,
      linkId: ids.DOCS_GUIDES_LINK,
    }),
    ...homeSections.documents,
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
