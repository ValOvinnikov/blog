import type {
  Module_sectionPages,
  Page_landing,
  Template_landing,
} from '@blog/config/sanity/generated/types';

import { BRAND_VARIANT, type TLocaleIsoCode } from '@blog/config/constants';

import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterModule,
  TStarterPage,
} from './starter-document';
import {
  keyedReference,
  moduleHeadingBlock,
  pageHeadingBlock,
  reference,
  seo,
  slug,
} from './starter-fields';
import {
  buildSectionChildPage,
  type TPageCopy,
  type TSectionPageCopy,
} from './starter-section-child-page';

type TSectionCopy = TPageCopy & {
  heading: string;
  supportingText: string;
  listHeading: string;
};

export function buildSectionPages({
  locale,
  name,
  ids,
  section,
  pages,
  hasSectionNavigation = false,
}: {
  locale: TLocaleIsoCode;
  name: string;
  ids: { page: string; template: string; list: string; childPrefix: string };
  section: TSectionCopy;
  pages: readonly TSectionPageCopy[];
  hasSectionNavigation?: boolean;
}): TStarterDocumentUnion[] {
  return [
    {
      _id: ids.list,
      _type: 'module_sectionPages',
      title: `${name} List`,
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, section.listHeading),
    } satisfies TStarterModule<Module_sectionPages>,
    {
      _id: ids.template,
      _type: 'template_landing',
      title: `${name} Template`,
      modules: [keyedReference(ids.list)],
    } satisfies TStarterDocument<Template_landing, 'title'>,
    {
      _id: ids.page,
      _type: 'page_landing',
      language: locale,
      title: section.title,
      slug: slug(section.slug),
      headingBlock: pageHeadingBlock(section.heading, section.supportingText),
      template: reference(ids.template),
      ...(hasSectionNavigation && {
        sectionNavigation: true,
        sectionNavigationTitle: section.title,
      }),
      seo: seo(section.metaTitle, section.metaDescription),
    } satisfies TStarterPage<Page_landing>,
    ...pages.flatMap((page, index) =>
      buildSectionChildPage({
        locale,
        pageId: `${ids.childPrefix}${index + 1}`,
        parentId: ids.page,
        page,
      }),
    ),
  ];
}
