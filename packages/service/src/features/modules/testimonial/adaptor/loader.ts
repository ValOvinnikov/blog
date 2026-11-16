import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';

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
        ...LINK_TARGET_CACHE_TAGS,
      ],
      tenant.projectId,
    ),
  });

  return toTestimonialModule(raw);
}
