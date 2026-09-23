import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { TestimonialModuleView } from './testimonial-module-view';

export interface ITestimonialModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const TestimonialModule = async ({
  id,
  tenant,
}: ITestimonialModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.testimonial.v1.getTestimonialModule(
    id,
    tenantContext,
  );

  if (!result.ok) {
    logger.error('testimonial_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }
  if (result.data.testimonials.length === 0) return null;

  return (
    <TestimonialModuleView
      {...result.data}
      titleId={`testimonial-${id}`}
      dataTestId={`testimonial-module-${id}`}
    />
  );
};
