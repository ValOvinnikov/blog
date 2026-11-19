import { PageShell } from '@web/components/page-templates/page-shell';
import type { ReactNode } from 'react';

import {
  TaxonomyIndexModuleRenderer,
  type ITaxonomyIndexModuleRendererProps,
} from './taxonomy-index-module-renderer';

interface ITaxonomyIndexPageProps extends ITaxonomyIndexModuleRendererProps {
  breadcrumbs: ReactNode;
}

export const TaxonomyIndexPage = async ({
  hero,
  headingBlock,
  headingAlignment,
  modules,
  breadcrumbs,
}: ITaxonomyIndexPageProps) => (
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
