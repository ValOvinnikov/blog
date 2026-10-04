import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { FaqModuleView } from './faq-module-view';

export interface IFaqModuleProps {
  id: string;
}

export const FaqModule = async ({ id }: IFaqModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.faq.v1.getFaqModule(id, sanityContext);

  if (!result.ok) {
    logger.error('faq_module.fetch_failed', { id, error: result.error });
    return null;
  }

  return (
    <FaqModuleView
      {...result.data}
      titleId={`faq-${id}`}
      dataTestId={`faq-module-${id}`}
    />
  );
};
