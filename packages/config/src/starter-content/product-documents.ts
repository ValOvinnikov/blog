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
import {
  buildCalloutCta,
  buildContentModule,
  buildPostListModule,
} from './starter-modules';
import { buildStatementHero } from './starter-statement-hero';

const ids = STARTER_DOCUMENT_IDS;

export function buildProductDocuments({
  locale,
  copy,
}: {
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
}): TStarterDocumentUnion[] {
  const { hero, intro, faq, cta, changelog } = copy.product;

  return [
    ...buildBaseDocuments({
      locale,
      copy,
      navigationItems: [navigationLink(ids.PRODUCT_CHANGELOG_LINK)],
      homeLayout: {
        hero: reference(ids.PRODUCT_HERO),
        modules: [
          moduleSlot(ids.PRODUCT_INTRO, 'module_content'),
          moduleSlot(ids.PRODUCT_FAQ, 'module_faq'),
          moduleSlot(ids.PRODUCT_CTA, 'module_cta'),
        ],
      },
      postIndexModules: [
        moduleSlot(ids.PRODUCT_CHANGELOG_LIST, 'module_postList'),
      ],
    }),
    buildStatementHero({
      id: ids.PRODUCT_HERO,
      locale,
      hero,
      linkId: ids.PRODUCT_CHANGELOG_LINK,
    }),
    buildContentModule({
      id: ids.PRODUCT_INTRO,
      title: INTRODUCTION_MODULE_TITLE,
      locale,
      body: paragraphs(intro.body),
    }),
    ...buildFaqModule({
      id: ids.PRODUCT_FAQ,
      title: QUESTIONS_MODULE_TITLE,
      locale,
      faq,
    }),
    buildCalloutCta({
      id: ids.PRODUCT_CTA,
      title: 'See the Changelog',
      locale,
      heading: cta.heading,
      supportingText: cta.supportingText,
      linkId: ids.PRODUCT_CHANGELOG_LINK,
    }),
    buildPostListModule({
      id: ids.PRODUCT_CHANGELOG_LIST,
      title: 'Changelog Post List',
      locale,
      heading: changelog.listHeading,
    }),
    internalLink(
      ids.PRODUCT_CHANGELOG_LINK,
      changelog.linkLabel,
      locale,
      ids.POST_INDEX,
    ),
  ];
}
