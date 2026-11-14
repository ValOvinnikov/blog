import { PRICE_PERIOD } from '@blog/config';
import { service } from '@blog/service';
import { PRICING_LOG } from '@web/constants/pricing';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { getSiteSettings } from '@web/server/site-settings/get-site-settings/get-site-settings';
import { logger } from '@web/utils/logger/logger';
import { toPricingPanels } from '@web/utils/to-pricing-panels';
import { getTranslations } from 'next-intl/server';

import { PricingModuleView } from './pricing-module-view';

export interface IPricingModuleProps {
  id: string;
}

export const PricingModule = async ({ id }: IPricingModuleProps) => {
  const { sanityContext, locale, tenantId } = await getRequestContext();
  const [result, settingsResult, t] = await Promise.all([
    service.modules.pricing.v1.getPricingModule(id, sanityContext),
    getSiteSettings(),
    getTranslations('pricingModule'),
  ]);

  if (!result.ok) {
    logger.error(PRICING_LOG.MODULE_FETCH_FAILED, { id, error: result.error });
    return null;
  }
  if (!settingsResult.ok) {
    logger.error(PRICING_LOG.SITE_SETTINGS_FAILED, {
      id,
      error: settingsResult.error,
    });
    return null;
  }

  const {
    brandVariant,
    layout,
    headingBlock,
    tiers,
    footnote,
    ctaButtons,
    contentAlignment,
    cardStyle,
    radiusScale,
    density,
  } = result.data;
  const { currency, pricePeriodWording } = settingsResult.data;
  const appearance = await getSectionAppearance(tenantId, {
    cardStyle,
    radiusScale,
    density,
  });
  const panels = toPricingPanels({
    tiers,
    locale,
    currency,
    labels: {
      free: t('free'),
      compareAtLabel: t('compareAtLabel'),
      from: t('from'),
      periods: {
        [PRICE_PERIOD.ONE_TIME]:
          pricePeriodWording[PRICE_PERIOD.ONE_TIME] ?? t('period.ONE_TIME'),
        [PRICE_PERIOD.HOUR]:
          pricePeriodWording[PRICE_PERIOD.HOUR] ?? t('period.HOUR'),
        [PRICE_PERIOD.SESSION]:
          pricePeriodWording[PRICE_PERIOD.SESSION] ?? t('period.SESSION'),
        [PRICE_PERIOD.MONTH]:
          pricePeriodWording[PRICE_PERIOD.MONTH] ?? t('period.MONTH'),
        [PRICE_PERIOD.YEAR]:
          pricePeriodWording[PRICE_PERIOD.YEAR] ?? t('period.YEAR'),
      },
    },
  });

  return (
    <PricingModuleView
      section={{ brandVariant, layout, appearance }}
      headingBlock={headingBlock}
      footnote={footnote}
      ctaButtons={ctaButtons}
      contentAlignment={contentAlignment}
      panels={panels}
      titleId={`pricing-${id}`}
      dataTestId={`pricing-module-${id}`}
    />
  );
};
