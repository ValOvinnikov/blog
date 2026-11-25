import type { TLocaleIsoCode } from '@shinefold/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { moduleSlot, reference } from './starter-fields';
import { buildHomeSections } from './starter-home-sections';
import { internalLink, navigationLink } from './starter-links';
import { buildPostListModule } from './starter-modules';
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

  const homeSections = buildHomeSections({
    locale,
    intro: { id: ids.PRODUCT_INTRO, ...intro },
    faq: { id: ids.PRODUCT_FAQ, ...faq },
    cta: {
      id: ids.PRODUCT_CTA,
      title: 'See the Changelog',
      linkId: ids.PRODUCT_CHANGELOG_LINK,
      ...cta,
    },
  });

  return [
    ...buildBaseDocuments({
      locale,
      copy,
      navigationItems: [navigationLink(ids.PRODUCT_CHANGELOG_LINK)],
      homeLayout: {
        hero: reference(ids.PRODUCT_HERO),
        modules: homeSections.modules,
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
    ...homeSections.documents,
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
