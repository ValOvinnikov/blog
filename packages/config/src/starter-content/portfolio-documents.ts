import type { TLocaleIsoCode } from '@blog/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { keyedReference, reference } from './starter-fields';
import { internalLink, navigationLink } from './starter-links';
import {
  buildAuthor,
  buildCalloutCta,
  buildContentModule,
  buildProfileHero,
} from './starter-modules';
import { buildSectionPages } from './starter-section-pages';

const ids = STARTER_DOCUMENT_IDS;

export function buildPortfolioDocuments({
  siteName,
  locale,
  copy,
}: {
  siteName: string;
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
}): TStarterDocumentUnion[] {
  const { hero, intro, cta, work, projects } = copy.portfolio;

  return [
    ...buildBaseDocuments({
      siteName,
      locale,
      copy,
      navigationItems: [navigationLink(ids.PORTFOLIO_WORK_LINK)],
      homeLayout: {
        hero: reference(ids.PORTFOLIO_HERO),
        modules: [ids.PORTFOLIO_INTRO, ids.PORTFOLIO_CTA].map(keyedReference),
      },
    }),
    buildAuthor(ids.PORTFOLIO_AUTHOR, siteName),
    buildProfileHero({
      id: ids.PORTFOLIO_HERO,
      title: 'Profile Hero',
      locale,
      eyebrow: hero.eyebrow,
      heading: hero.heading,
      authorId: ids.PORTFOLIO_AUTHOR,
    }),
    buildContentModule({
      id: ids.PORTFOLIO_INTRO,
      title: 'Introduction',
      locale,
      body: intro.body,
    }),
    buildCalloutCta({
      id: ids.PORTFOLIO_CTA,
      title: 'See the Work',
      locale,
      heading: cta.heading,
      supportingText: cta.supportingText,
      linkId: ids.PORTFOLIO_WORK_LINK,
    }),
    internalLink(
      ids.PORTFOLIO_WORK_LINK,
      work.title,
      locale,
      ids.PORTFOLIO_WORK,
    ),
    ...buildSectionPages({
      locale,
      name: 'Work',
      ids: {
        page: ids.PORTFOLIO_WORK,
        template: ids.PORTFOLIO_WORK_TEMPLATE,
        list: ids.PORTFOLIO_WORK_LIST,
        childPrefix: ids.PORTFOLIO_PROJECT_PREFIX,
      },
      section: work,
      pages: projects,
    }),
  ];
}
