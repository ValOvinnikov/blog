import type { TLocaleIsoCode } from '@shinefold/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { moduleSlot, reference } from './starter-fields';
import { buildHomeSections } from './starter-home-sections';
import { internalLink, navigationLink } from './starter-links';
import {
  buildAuthor,
  buildPostListModule,
  buildProfileHero,
} from './starter-modules';

const ids = STARTER_DOCUMENT_IDS;

export function buildPersonalDocuments({
  siteName,
  locale,
  copy,
}: {
  siteName: string;
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
}): TStarterDocumentUnion[] {
  const { hero, intro, faq, cta, writing } = copy.personal;

  const homeSections = buildHomeSections({
    locale,
    intro: { id: ids.PERSONAL_INTRO, ...intro },
    faq: { id: ids.PERSONAL_FAQ, ...faq },
    cta: {
      id: ids.PERSONAL_CTA,
      title: 'Read the Writing',
      linkId: ids.PERSONAL_WRITING_LINK,
      ...cta,
    },
  });

  return [
    ...buildBaseDocuments({
      locale,
      copy,
      navigationItems: [navigationLink(ids.PERSONAL_WRITING_LINK)],
      homeLayout: {
        hero: reference(ids.PERSONAL_HERO),
        modules: homeSections.modules,
      },
      postIndexModules: [moduleSlot(ids.PERSONAL_POST_LIST, 'module_postList')],
    }),
    buildAuthor(ids.PERSONAL_AUTHOR, siteName),
    buildProfileHero({
      id: ids.PERSONAL_HERO,
      title: 'Profile Hero',
      locale,
      eyebrow: hero.eyebrow,
      heading: hero.heading,
      authorId: ids.PERSONAL_AUTHOR,
    }),
    ...homeSections.documents,
    buildPostListModule({
      id: ids.PERSONAL_POST_LIST,
      title: 'Writing Post List',
      locale,
      heading: writing.listHeading,
    }),
    internalLink(
      ids.PERSONAL_WRITING_LINK,
      writing.linkLabel,
      locale,
      ids.POST_INDEX,
    ),
  ];
}
