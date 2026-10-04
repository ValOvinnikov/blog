import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { TestimonialModuleView } from './testimonial-module-view';

export interface ITestimonialModuleProps {
  id: string;
}

export const TestimonialModule = async ({ id }: ITestimonialModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.testimonial.v1.getTestimonialModule(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('testimonial_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }
  return (
    <TestimonialModuleView
      {...result.data}
      titleId={`testimonial-${id}`}
      dataTestId={`testimonial-module-${id}`}
    />
  );
};
