import { service } from '@shinefold/service';
import { hasLength } from '@shinefold/utils/primitives';
import { SECTION_PAGES_LOG } from '@web/constants/section-pages';
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
    logger.warn(SECTION_PAGES_LOG.MISSING_LANDING_PAGE_CONTEXT, { id });
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
    logger.error(SECTION_PAGES_LOG.MODULE_FETCH_FAILED, {
      id,
      parentId: landingPage.id,
      error: result.error,
    });
    return null;
  }

  if (!hasLength(result.data.pages)) return null;

  return (
    <SectionPagesModuleView
      {...result.data}
      titleId={`section-pages-${id}`}
      dataTestId={`section-pages-module-${id}`}
    />
  );
};
