import type { TLocaleIsoCode } from '@shinefold/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import { buildContentPage } from './starter-content-page';
import type { TStarterDocumentUnion } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { reference } from './starter-fields';
import { buildHomeSections } from './starter-home-sections';
import { internalLink, navigationLink } from './starter-links';
import { buildStatementHero } from './starter-statement-hero';

const ids = STARTER_DOCUMENT_IDS;

export function buildBusinessDocuments({
  locale,
  copy,
}: {
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
}): TStarterDocumentUnion[] {
  const { hero, intro, faq, cta, services, about, contact } = copy.business;
  const pages = [
    {
      pageId: ids.BUSINESS_SERVICES,
      linkId: ids.BUSINESS_SERVICES_LINK,
      page: services,
    },
    {
      pageId: ids.BUSINESS_ABOUT,
      linkId: ids.BUSINESS_ABOUT_LINK,
      page: about,
    },
    {
      pageId: ids.BUSINESS_CONTACT,
      linkId: ids.BUSINESS_CONTACT_LINK,
      page: contact,
    },
  ];

  const homeSections = buildHomeSections({
    locale,
    intro: { id: ids.BUSINESS_INTRO, ...intro },
    faq: { id: ids.BUSINESS_FAQ, ...faq },
    cta: {
      id: ids.BUSINESS_CTA,
      title: 'Get in Touch',
      linkId: ids.BUSINESS_CONTACT_LINK,
      ...cta,
    },
  });

  return [
    ...buildBaseDocuments({
      locale,
      copy,
      navigationItems: pages.map(({ linkId }) => navigationLink(linkId)),
      homeLayout: {
        hero: reference(ids.BUSINESS_HERO),
        modules: homeSections.modules,
      },
    }),
    buildStatementHero({
      id: ids.BUSINESS_HERO,
      locale,
      hero,
      linkId: ids.BUSINESS_SERVICES_LINK,
    }),
    ...homeSections.documents,
    ...pages.flatMap(({ pageId, linkId, page }) => [
      internalLink(linkId, page.title, locale, pageId),
      ...buildContentPage({ locale, pageId, page }),
    ]),
  ];
}
