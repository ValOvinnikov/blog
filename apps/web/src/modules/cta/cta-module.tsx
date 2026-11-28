import { service } from '@shinefold/service';
import { CTA_LOG } from '@web/constants/cta';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { logger } from '@web/utils/logger/logger';

import { CtaModuleView } from './cta-module-view';

export interface ICtaModuleProps {
  id: string;
}

export const CtaModule = async ({ id }: ICtaModuleProps) => {
  const { sanityContext, tenantId } = await getRequestContext();
  const result = await service.modules.cta.v1.getCta(id, sanityContext);

  if (!result.ok) {
    logger.error(CTA_LOG.MODULE_FETCH_FAILED, { id, error: result.error });
    return null;
  }

  const { cardStyle, radiusScale, density } = result.data;
  const appearance = await getSectionAppearance(tenantId, {
    cardStyle,
    radiusScale,
    density,
  });

  return <CtaModuleView id={id} module={result.data} appearance={appearance} />;
};
