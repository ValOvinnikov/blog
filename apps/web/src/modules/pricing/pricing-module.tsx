import { PRICE_PERIOD } from '@blog/config';
import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { logger } from '@web/utils/logger/logger';
import { toPricingPanels } from '@web/utils/to-pricing-panels';
import { getTranslations } from 'next-intl/server';

import { PricingModuleView } from './pricing-module-view';

export interface IPricingModuleProps {
  id: string;
}

export const PricingModule = async ({ id }: IPricingModuleProps) => {
  const { sanityContext, locale } = await getRequestContext();
  const [result, settingsResult, t] = await Promise.all([
    service.modules.pricing.v1.getPricingModule(id, sanityContext),
    getSiteSettings(),
    getTranslations('pricingModule'),
  ]);

  if (!result.ok) {
    logger.error('pricing_module.fetch_failed', { id, error: result.error });
    return null;
  }
  if (!settingsResult.ok) {
    logger.error('pricing_module.site_settings_failed', {
      id,
      error: settingsResult.error,
    });
    return null;
  }

  const { tiers, ...pricingModule } = result.data;
  const panels = toPricingPanels({
    tiers,
    locale,
    currency: settingsResult.data.currency,
    labels: {
      free: t('free'),
      compareAtLabel: t('compareAtLabel'),
      from: t('from'),
      periods: {
        [PRICE_PERIOD.ONE_TIME]: t('period.ONE_TIME'),
        [PRICE_PERIOD.HOUR]: t('period.HOUR'),
        [PRICE_PERIOD.SESSION]: t('period.SESSION'),
        [PRICE_PERIOD.MONTH]: t('period.MONTH'),
        [PRICE_PERIOD.YEAR]: t('period.YEAR'),
      },
    },
  });

  return (
    <PricingModuleView
      {...pricingModule}
      panels={panels}
      titleId={`pricing-${id}`}
      dataTestId={`pricing-module-${id}`}
    />
  );
};
