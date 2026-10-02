import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { CtaModuleView } from './cta-module-view';

export interface ICtaModuleProps {
  id: string;
}

export const CtaModule = async ({ id }: ICtaModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.cta.v1.getCta(id, sanityContext);

  if (!result.ok) {
    logger.error('cta_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  return <CtaModuleView id={id} {...result.data} />;
};
