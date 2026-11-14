import { service } from '@blog/service';
import { TESTIMONIAL_LOG } from '@web/constants/testimonial';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { logger } from '@web/utils/logger/logger';

import { TestimonialModuleView } from './testimonial-module-view';

export interface ITestimonialModuleProps {
  id: string;
}

export const TestimonialModule = async ({ id }: ITestimonialModuleProps) => {
  const { sanityContext, tenantId } = await getRequestContext();
  const result = await service.modules.testimonial.v1.getTestimonialModule(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(TESTIMONIAL_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    return null;
  }

  const {
    brandVariant,
    layout,
    cardStyle,
    radiusScale,
    density,
    ...testimonialModule
  } = result.data;
  const appearance = await getSectionAppearance(tenantId, {
    cardStyle,
    radiusScale,
    density,
  });

  return (
    <TestimonialModuleView
      {...testimonialModule}
      section={{ brandVariant, layout, appearance }}
      titleId={`testimonial-${id}`}
      dataTestId={`testimonial-module-${id}`}
    />
  );
};
