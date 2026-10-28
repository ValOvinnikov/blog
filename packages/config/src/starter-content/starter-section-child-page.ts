import type {
  Page_landing,
  Template_landing,
} from '@blog/config/sanity/generated/types';

import type { TLocaleIsoCode } from '@blog/config/constants';

import type {
  TStarterDocument,
  TStarterDocumentUnion,
  TStarterPage,
} from './starter-document';
import {
  keyedReference,
  pageHeadingBlock,
  reference,
  seo,
  slug,
} from './starter-fields';
import { buildContentModule } from './starter-modules';

export type TPageCopy = {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
};

export type TSectionPageCopy = TPageCopy & {
  summary: string;
  body: readonly string[];
};

export function buildSectionChildPage({
  locale,
  pageId,
  parentId,
  page,
}: {
  locale: TLocaleIsoCode;
  pageId: string;
  parentId: string;
  page: TSectionPageCopy;
}): TStarterDocumentUnion[] {
  const templateId = `${pageId}Template`;
  const bodyId = `${pageId}Body`;

  return [
    buildContentModule({
      id: bodyId,
      title: `${page.title} Body`,
      locale,
      body: page.body,
    }),
    {
      _id: templateId,
      _type: 'template_landing',
      title: `${page.title} Template`,
      modules: [keyedReference(bodyId)],
    } satisfies TStarterDocument<Template_landing, 'title'>,
    {
      _id: pageId,
      _type: 'page_landing',
      language: locale,
      title: page.title,
      parent: reference(parentId),
      slug: slug(page.slug),
      headingBlock: pageHeadingBlock(page.title, page.summary),
      template: reference(templateId),
      seo: seo(page.metaTitle, page.metaDescription),
    } satisfies TStarterPage<Page_landing>,
  ];
}
