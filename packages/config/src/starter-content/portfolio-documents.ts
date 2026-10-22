import type {
  Module_content,
  Module_cta,
  Module_heroProfile,
  Person,
} from '@blog/config/sanity/generated/types';

import {
  BRAND_VARIANT,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  CTA_VARIANT,
  HERO_VARIANT,
  PORTABLE_TEXT_BLOCK_TYPE,
  type TLocaleIsoCode,
} from '@blog/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import { buildPortfolioPages } from './portfolio-pages';
import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterModule,
} from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import {
  internalLink,
  keyedReference,
  localizedArticleText,
  localizedString,
  moduleHeadingBlock,
  reference,
} from './starter-fields';

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
  const { hero, intro, cta, work } = copy.portfolio;

  return [
    ...buildBaseDocuments({
      siteName,
      locale,
      copy,
      navigationItems: [
        {
          _key: ids.PORTFOLIO_WORK_LINK,
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          link: reference(ids.PORTFOLIO_WORK_LINK),
        },
      ],
      homeLayout: {
        hero: reference(ids.PORTFOLIO_HERO),
        modules: [ids.PORTFOLIO_INTRO, ids.PORTFOLIO_CTA].map(keyedReference),
      },
    }),
    {
      _id: ids.PORTFOLIO_AUTHOR,
      _type: 'person',
      name: siteName,
    } satisfies TStarterDocument<Person, 'name'>,
    {
      _id: ids.PORTFOLIO_HERO,
      _type: 'module_heroProfile',
      title: 'Profile Hero',
      brandVariant: BRAND_VARIANT.PRIMARY,
      variant: HERO_VARIANT.STACKED,
      headingBlock: moduleHeadingBlock(locale, hero.heading),
      eyebrow: localizedString(locale, hero.eyebrow),
      author: reference(ids.PORTFOLIO_AUTHOR),
    } satisfies TStarterModule<Module_heroProfile>,
    {
      _id: ids.PORTFOLIO_INTRO,
      _type: 'module_content',
      title: 'Introduction',
      brandVariant: BRAND_VARIANT.PRIMARY,
      body: localizedArticleText(locale, intro.body),
    } satisfies TStarterModule<Module_content>,
    {
      _id: ids.PORTFOLIO_CTA,
      _type: 'module_cta',
      title: 'See the Work',
      brandVariant: BRAND_VARIANT.SECONDARY,
      bandTone: BRAND_VARIANT.PRIMARY,
      variant: CTA_VARIANT.CALLOUT,
      headingBlock: moduleHeadingBlock(locale, cta.heading, cta.supportingText),
      ctaButtons: [
        {
          _key: ids.PORTFOLIO_WORK_LINK,
          _type: 'ctaButton',
          variant: CTA_ACTION_VARIANT.PRIMARY,
          appearance: CTA_ACTION_APPEARANCE.CONTAINED,
          link: reference(ids.PORTFOLIO_WORK_LINK),
        },
      ],
    } satisfies TStarterModule<Module_cta>,
    internalLink(
      ids.PORTFOLIO_WORK_LINK,
      work.title,
      locale,
      ids.PORTFOLIO_WORK,
    ),
    ...buildPortfolioPages(locale, copy),
  ];
}
