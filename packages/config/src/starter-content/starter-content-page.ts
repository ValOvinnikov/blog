import type { TLocaleIsoCode } from '@shinefold/config/constants';
import type {
  Page_landing,
  Template_landing,
} from '@shinefold/config/sanity/generated/types';

import type { TStarterDocumentUnion, TStarterPage } from './starter-document';
import type { TStarterTemplate } from './starter-document-shape';
import { moduleSlot, paragraphs, reference, slug } from './starter-fields';
import { buildContentModule } from './starter-modules';
import { pageFields, starterTemplate } from './starter-pages';

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
      ...starterTemplate(
        templateId,
        'template_landing',
        `${page.title} Template`,
      ),
      modules: [moduleSlot(bodyId, 'module_content')],
    } satisfies TStarterTemplate<Template_landing>,
    {
      _id: pageId,
      _type: 'page_landing',
      ...pageFields(locale, templateId, {
        ...page,
        heading: page.title,
        supportingText: page.summary,
      }),
      ...(parentId && { parent: reference(parentId) }),
      slug: slug(page.slug),
    } satisfies TStarterPage<Page_landing>,
  ];
}
