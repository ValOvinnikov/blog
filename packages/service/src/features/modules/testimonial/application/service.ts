import { getTestimonialModule } from '@shinefold/service/features/modules/testimonial/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

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
