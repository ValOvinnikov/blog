import type { TLocaleIsoCode } from '@blog/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { buildFaqModule } from './starter-faq';
import { keyedReference, reference } from './starter-fields';
import { internalLink, navigationLink } from './starter-links';
import {
  buildAuthor,
  buildCalloutCta,
  buildContentModule,
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

  return [
    ...buildBaseDocuments({
      siteName,
      locale,
      copy,
      navigationItems: [navigationLink(ids.PERSONAL_WRITING_LINK)],
      homeLayout: {
        hero: reference(ids.PERSONAL_HERO),
        modules: [ids.PERSONAL_INTRO, ids.PERSONAL_FAQ, ids.PERSONAL_CTA].map(
          keyedReference,
        ),
      },
      postIndexModules: [keyedReference(ids.PERSONAL_POST_LIST)],
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
    buildContentModule({
      id: ids.PERSONAL_INTRO,
      title: 'Introduction',
      locale,
      body: intro.body,
    }),
    ...buildFaqModule({
      id: ids.PERSONAL_FAQ,
      title: 'Questions',
      locale,
      faq,
    }),
    buildCalloutCta({
      id: ids.PERSONAL_CTA,
      title: 'Read the Writing',
      locale,
      heading: cta.heading,
      supportingText: cta.supportingText,
      linkId: ids.PERSONAL_WRITING_LINK,
    }),
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
