import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { testimonialModuleQuery } from './query';
import { toTestimonialModule } from './transformer';
import type { TTestimonialModule } from './types';

export async function getTestimonialModule(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TTestimonialModule> {
  const raw = await runQuery(testimonialModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:testimonial',
        `module:${id}`,
        'block_testimonial',
        'link',
        'homePage',
        'page_landing',
      ],
      tenant.projectId,
    ),
  });

  return toTestimonialModule(raw);
}
