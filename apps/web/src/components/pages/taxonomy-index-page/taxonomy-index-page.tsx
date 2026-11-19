import { PageShell } from '@web/components/page-templates/page-shell';
import type { ReactNode } from 'react';

import {
  TaxonomyIndexModuleRenderer,
  type ITaxonomyIndexModuleRendererProps,
} from './taxonomy-index-module-renderer';

interface ITaxonomyIndexPageProps {
  pageData: ITaxonomyIndexModuleRendererProps;
  breadcrumbs: ReactNode;
}

export const TaxonomyIndexPage = async ({
  pageData,
  breadcrumbs,
}: ITaxonomyIndexPageProps) => {
  const { hero, headingBlock, headingAlignment, modules } = pageData;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>{breadcrumbs}</PageShell.Breadcrumbs>
      <TaxonomyIndexModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        headingAlignment={headingAlignment}
        modules={modules}
      />
    </PageShell>
  );
};
