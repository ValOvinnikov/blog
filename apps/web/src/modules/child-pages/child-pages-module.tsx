import { service } from '@blog/service';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { ChildPagesModuleView } from './child-pages-module-view';

export type TChildPagesModuleProps = TModuleComponentProps;

export const ChildPagesModule = async ({
  id,
  context,
}: TChildPagesModuleProps) => {
  const landingPage = context?.landingPage;
  if (!landingPage) {
    logger.warn('child_pages_module.missing_landing_page_context', { id });
    return null;
  }

  const { sanityContext } = await getRequestContext();
  const result = await service.modules.childPages.v1.getChildPagesModule(
    id,
    landingPage.id,
    landingPage.path,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('child_pages_module.fetch_failed', {
      id,
      parentId: landingPage.id,
      error: result.error,
    });
    return null;
  }

  if (result.data.pages.length === 0) return null;

  return (
    <ChildPagesModuleView
      {...result.data}
      titleId={`child-pages-${id}`}
      dataTestId={`child-pages-module-${id}`}
    />
  );
};
