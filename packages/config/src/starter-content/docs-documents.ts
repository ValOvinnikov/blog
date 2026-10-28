import type { Module_heroStatement } from '@blog/config/sanity/generated/types';

import {
  BRAND_VARIANT,
  HERO_VARIANT,
  type TLocaleIsoCode,
} from '@blog/config/constants';

import { buildBaseDocuments } from './base-documents';
import type { TStarterCopy } from './copy/starter-copy';
import type { TStarterDocumentUnion, TStarterModule } from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import { buildFaqModule } from './starter-faq';
import {
  keyedReference,
  localizedString,
  moduleHeadingBlock,
  reference,
} from './starter-fields';
import { ctaButton, internalLink, navigationLink } from './starter-links';
import { buildContentModule } from './starter-modules';
import { buildSectionPages } from './starter-section-pages';

const ids = STARTER_DOCUMENT_IDS;

export function buildDocsDocuments({
  siteName,
  locale,
  copy,
}: {
  siteName: string;
  locale: TLocaleIsoCode;
  copy: TStarterCopy;
}): TStarterDocumentUnion[] {
  const { hero, intro, faq, guides, pages } = copy.docs;

  return [
    ...buildBaseDocuments({
      siteName,
      locale,
      copy,
      navigationItems: [navigationLink(ids.DOCS_GUIDES_LINK)],
      homeLayout: {
        hero: reference(ids.DOCS_HERO),
        modules: [ids.DOCS_INTRO, ids.DOCS_FAQ].map(keyedReference),
      },
    }),
    {
      _id: ids.DOCS_HERO,
      _type: 'module_heroStatement',
      title: 'Statement Hero',
      brandVariant: BRAND_VARIANT.PRIMARY,
      variant: HERO_VARIANT.STACKED,
      headingBlock: moduleHeadingBlock(
        locale,
        hero.heading,
        hero.supportingText,
      ),
      eyebrow: localizedString(locale, hero.eyebrow),
      ctaButtons: [ctaButton(ids.DOCS_GUIDES_LINK)],
    } satisfies TStarterModule<Module_heroStatement>,
    buildContentModule({
      id: ids.DOCS_INTRO,
      title: 'Introduction',
      locale,
      body: intro.body,
    }),
    ...buildFaqModule({ id: ids.DOCS_FAQ, title: 'Questions', locale, faq }),
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
