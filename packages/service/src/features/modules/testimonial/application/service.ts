import { getTestimonialModule } from '@blog/service/features/modules/testimonial/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createTestimonialModuleService() {
  return {
    v1: {
      getTestimonialModule: safeAsync(
        (id: string, tenant: TTenantSanityContext) =>
          getTestimonialModule(id, tenant),
      ),
    },
  };
}
