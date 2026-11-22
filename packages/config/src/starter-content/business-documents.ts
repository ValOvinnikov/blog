import type { TLocaleIsoCode } from '@shinefold/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import { buildContentPage } from './starter-content-page';
import type { TStarterDocumentUnion } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { buildFaqModule } from './starter-faq';
import { moduleSlot, paragraphs, reference } from './starter-fields';
import { internalLink, navigationLink } from './starter-links';
import {
  INTRODUCTION_MODULE_TITLE,
  QUESTIONS_MODULE_TITLE,
} from './starter-module-titles';
import { buildCalloutCta, buildContentModule } from './starter-modules';
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

  return [
    ...buildBaseDocuments({
      locale,
      copy,
      navigationItems: pages.map(({ linkId }) => navigationLink(linkId)),
      homeLayout: {
        hero: reference(ids.BUSINESS_HERO),
        modules: [
          moduleSlot(ids.BUSINESS_INTRO, 'module_content'),
          moduleSlot(ids.BUSINESS_FAQ, 'module_faq'),
          moduleSlot(ids.BUSINESS_CTA, 'module_cta'),
        ],
      },
    }),
    buildStatementHero({
      id: ids.BUSINESS_HERO,
      locale,
      hero,
      linkId: ids.BUSINESS_SERVICES_LINK,
    }),
    buildContentModule({
      id: ids.BUSINESS_INTRO,
      title: INTRODUCTION_MODULE_TITLE,
      locale,
      body: paragraphs(intro.body),
    }),
    ...buildFaqModule({
      id: ids.BUSINESS_FAQ,
      title: QUESTIONS_MODULE_TITLE,
      locale,
      faq,
    }),
    buildCalloutCta({
      id: ids.BUSINESS_CTA,
      title: 'Get in Touch',
      locale,
      heading: cta.heading,
      supportingText: cta.supportingText,
      linkId: ids.BUSINESS_CONTACT_LINK,
    }),
    ...pages.flatMap(({ pageId, linkId, page }) => [
      internalLink(linkId, page.title, locale, pageId),
      ...buildContentPage({ locale, pageId, page }),
    ]),
  ];
}
