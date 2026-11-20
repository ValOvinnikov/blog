import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type {
  Page_landing,
  Template_landing,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterDocumentUnion, TStarterPage } from './starter-document';
import type { TStarterTemplate } from './starter-document-shape';
import {
  moduleSlot,
  pageHeadingBlock,
  paragraphs,
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

export type TContentPageCopy = TPageCopy & {
  summary: string;
  body: readonly string[];
};

export function buildContentPage({
  locale,
  pageId,
  parentId,
  page,
}: {
  locale: TLocaleIsoCode;
  pageId: string;
  parentId?: string;
  page: TContentPageCopy;
}): TStarterDocumentUnion[] {
  const templateId = `${pageId}Template`;
  const bodyId = `${pageId}Body`;

  return [
    buildContentModule({
      id: bodyId,
      title: `${page.title} Body`,
      locale,
      body: paragraphs(page.body),
    }),
    {
      _id: templateId,
      _type: 'template_landing',
      title: `${page.title} Template`,
      modules: [moduleSlot(bodyId, 'module_content')],
    } satisfies TStarterTemplate<Template_landing>,
    {
      _id: pageId,
      _type: 'page_landing',
      language: locale,
      title: page.title,
      ...(parentId && { parent: reference(parentId) }),
      slug: slug(page.slug),
      headingBlock: pageHeadingBlock(page.title, page.summary),
      template: reference(templateId),
      seo: seo(page.metaTitle, page.metaDescription),
    } satisfies TStarterPage<Page_landing>,
  ];
}
