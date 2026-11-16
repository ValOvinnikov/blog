import { service } from '@shinefold/service';
import { TESTIMONIAL_LOG } from '@web/constants/testimonial';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getModuleSection } from '@web/server/site-config/get-module-section/get-module-section';
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

  const { section, content } = await getModuleSection(tenantId, result.data);

  return (
    <TestimonialModuleView
      {...content}
      section={section}
      titleId={`testimonial-${id}`}
      dataTestId={`testimonial-module-${id}`}
    />
  );
};
