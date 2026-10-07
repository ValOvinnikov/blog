import { service } from '@blog/service';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { SectionPagesModuleView } from './section-pages-module-view';

export type TSectionPagesModuleProps = TModuleComponentProps;

export const SectionPagesModule = async ({
  id,
  context,
}: TSectionPagesModuleProps) => {
  const landingPage = context?.landingPage;
  if (!landingPage) {
    logger.warn('section_pages_module.missing_landing_page_context', { id });
    return null;
  }

  const { sanityContext } = await getRequestContext();
  const result = await service.modules.sectionPages.v1.getSectionPagesModule(
    id,
    landingPage.id,
    landingPage.path,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('section_pages_module.fetch_failed', {
      id,
      parentId: landingPage.id,
      error: result.error,
    });
    return null;
  }

  if (result.data.pages.length === 0) return null;

  return (
    <SectionPagesModuleView
      {...result.data}
      titleId={`section-pages-${id}`}
      dataTestId={`section-pages-module-${id}`}
    />
  );
};
