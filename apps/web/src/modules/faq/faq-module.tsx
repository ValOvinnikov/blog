import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { FaqModuleView } from './faq-module-view';

export interface IFaqModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const FaqModule = async ({ id, tenant }: IFaqModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.faq.v1.getFaqModule(id, tenantContext);

  if (!result.ok) {
    logger.error('faq_module.fetch_failed', { id, error: result.error });
    return null;
  }
  if (result.data.questions.length === 0) return null;

  return (
    <FaqModuleView
      {...result.data}
      titleId={`faq-${id}`}
      dataTestId={`faq-module-${id}`}
    />
  );
};
