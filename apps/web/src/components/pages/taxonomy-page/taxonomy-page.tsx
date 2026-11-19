import type { TTaxonomyKind } from '@shinefold/config';
import type {
  TTag,
  TTagDetailPage,
  TTopic,
  TTopicDetailPage,
} from '@shinefold/service';
import { FaqPageSchema } from '@web/components/features/faq-page-schema';
import { PageShell } from '@web/components/page-templates/page-shell';
import type { ReactNode } from 'react';

import { TaxonomyModuleRenderer } from './taxonomy-module-renderer';

interface ITaxonomyPageProps {
  kind: TTaxonomyKind;
  slug: string;
  page?: number;
  term: TTag | TTopic;
  pageData: Omit<TTagDetailPage, 'tag'> | Omit<TTopicDetailPage, 'topic'>;
  breadcrumbs: ReactNode;
  children?: ReactNode;
}

export const TaxonomyPage = async ({
  kind,
  slug,
  page,
  term,
  pageData,
  breadcrumbs,
  children,
}: ITaxonomyPageProps) => {
  const { headingBlock, headingAlignment, hero, modules, faqs } = pageData;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>{breadcrumbs}</PageShell.Breadcrumbs>
      <FaqPageSchema faqs={faqs} />
      <TaxonomyModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        headingAlignment={headingAlignment}
        modules={modules}
        context={{
          page: page ?? 1,
          archive: { id: term.id, kind, slug, name: term.title },
        }}
      >
        {children}
      </TaxonomyModuleRenderer>
    </PageShell>
  );
};
