import type {
  Block_faq,
  Module_faq,
} from '@blog/config/sanity/generated/types';

import { BRAND_VARIANT, type TLocaleIsoCode } from '@blog/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterModule,
} from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import {
  keyedReference,
  localizedListedText,
  localizedString,
  moduleHeadingBlock,
  reference,
} from './starter-fields';
import { internalLink, navigationLink } from './starter-links';
import {
  buildAuthor,
  buildCalloutCta,
  buildContentModule,
  buildPostListModule,
  buildProfileHero,
} from './starter-modules';

const ids = STARTER_DOCUMENT_IDS;

function buildFaq(
  locale: TLocaleIsoCode,
  { faq }: TStarterCopy['personal'],
): TStarterDocumentUnion[] {
  const questions = faq.questions.map(
    ({ question, answer }, index) =>
      ({
        _id: `${ids.PERSONAL_FAQ}Question${index + 1}`,
        _type: 'block_faq',
        title: question,
        question: localizedString(locale, question),
        answer: localizedListedText(locale, answer),
      }) satisfies TStarterDocument<Block_faq, 'title' | 'question' | 'answer'>,
  );

  return [
    ...questions,
    {
      _id: ids.PERSONAL_FAQ,
      _type: 'module_faq',
      title: 'Questions',
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, faq.heading),
      questions: questions.map(({ _id }) => keyedReference(_id)),
    } satisfies TStarterModule<Module_faq>,
  ];
}

export function buildPersonalDocuments({
  siteName,
  locale,
  copy,
}: {
  siteName: string;
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
}): TStarterDocumentUnion[] {
  const { personal } = copy;
  const { hero, intro, cta, writing } = personal;

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
    ...buildFaq(locale, personal),
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
