import {
  BRAND_VARIANT,
  type TLocaleIsoCode,
} from '@shinefold/config/constants';
import type {
  Module_sectionPages,
  Page_landing,
  Template_landing,
} from '@shinefold/config/sanity/generated/types';

import {
  buildContentPage,
  type TPageCopy,
  type TContentPageCopy,
} from './starter-content-page';
import type {
  TStarterDocumentUnion,
  TStarterModule,
  TStarterPage,
} from './starter-document';
import type { TStarterTemplate } from './starter-document-shape';
import { moduleSlot, moduleHeadingBlock, slug } from './starter-fields';
import { pageFields, starterTemplate } from './starter-pages';

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
  pages: readonly TContentPageCopy[];
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
      ...starterTemplate(ids.template, 'template_landing', `${name} Template`),
      modules: [moduleSlot(ids.list, 'module_sectionPages')],
    } satisfies TStarterTemplate<Template_landing>,
    {
      _id: ids.page,
      _type: 'page_landing',
      ...pageFields(locale, ids.template, section),
      slug: slug(section.slug),
      ...(hasSectionNavigation && {
        sectionNavigation: true,
        sectionNavigationTitle: section.title,
        showPreviousNextLinks: true,
      }),
    } satisfies TStarterPage<Page_landing>,
    ...pages.flatMap((page, index) =>
      buildContentPage({
        locale,
        pageId: `${ids.childPrefix}${index + 1}`,
        parentId: ids.page,
        page,
      }),
    ),
  ];
}
