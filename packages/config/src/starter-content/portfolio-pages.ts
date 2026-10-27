import type {
  Module_sectionPages,
  Page_landing,
  Template_landing,
} from '@blog/config/sanity/generated/types';

import { BRAND_VARIANT, type TLocaleIsoCode } from '@blog/config/constants';

import type { TStarterCopy } from './copy/starter-copy';
import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterModule,
  TStarterPage,
} from './starter-document';
import { STARTER_DOCUMENT_IDS } from './starter-document-ids';
import {
  keyedReference,
  moduleHeadingBlock,
  pageHeadingBlock,
  reference,
  seo,
  slug,
} from './starter-fields';
import { buildContentModule } from './starter-modules';

type TProjectCopy = TStarterCopy['portfolio']['projects'][number];

const ids = STARTER_DOCUMENT_IDS;

function buildProject(
  locale: TLocaleIsoCode,
  project: TProjectCopy,
  position: number,
): TStarterDocumentUnion[] {
  const pageId = `starter.portfolio.project${position}`;
  const templateId = `${pageId}Template`;
  const bodyId = `${pageId}Body`;

  return [
    buildContentModule({
      id: bodyId,
      title: `${project.title} Body`,
      locale,
      body: project.body,
    }),
    {
      _id: templateId,
      _type: 'template_landing',
      title: `${project.title} Template`,
      modules: [keyedReference(bodyId)],
    } satisfies TStarterDocument<Template_landing, 'title'>,
    {
      _id: pageId,
      _type: 'page_landing',
      language: locale,
      title: project.title,
      parent: reference(ids.PORTFOLIO_WORK),
      slug: slug(project.slug),
      headingBlock: pageHeadingBlock(project.title, project.summary),
      template: reference(templateId),
      seo: seo(project.metaTitle, project.metaDescription),
    } satisfies TStarterPage<Page_landing>,
  ];
}

export function buildPortfolioPages(
  locale: TLocaleIsoCode,
  { portfolio: { work, projects } }: TStarterCopy,
): TStarterDocumentUnion[] {
  return [
    {
      _id: ids.PORTFOLIO_WORK_LIST,
      _type: 'module_sectionPages',
      title: 'Work List',
      brandVariant: BRAND_VARIANT.PRIMARY,
      headingBlock: moduleHeadingBlock(locale, work.listHeading),
    } satisfies TStarterModule<Module_sectionPages>,
    {
      _id: ids.PORTFOLIO_WORK_TEMPLATE,
      _type: 'template_landing',
      title: 'Work Template',
      modules: [keyedReference(ids.PORTFOLIO_WORK_LIST)],
    } satisfies TStarterDocument<Template_landing, 'title'>,
    {
      _id: ids.PORTFOLIO_WORK,
      _type: 'page_landing',
      language: locale,
      title: work.title,
      slug: slug(work.slug),
      headingBlock: pageHeadingBlock(work.heading, work.supportingText),
      template: reference(ids.PORTFOLIO_WORK_TEMPLATE),
      seo: seo(work.metaTitle, work.metaDescription),
    } satisfies TStarterPage<Page_landing>,
    ...projects.flatMap((project, index) =>
      buildProject(locale, project, index + 1),
    ),
  ];
}
