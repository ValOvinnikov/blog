import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import { buildLocaleParams } from '@blog/service/shared/localization/locale-params';

import { ctaModuleQuery } from './query';
import { toCtaModule } from './transformer';
import type { TCtaModule } from './types';

export async function getCta(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TCtaModule> {
  const raw = await runQuery(ctaModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:cta',
        `module:${id}`,
        'link',
        'homePage',
        'page_landing',
        'page_post',
        'page_postIndex',
        'page_topic',
        'page_topicIndex',
        'page_tag',
        'page_tagIndex',
        'topic',
      ],
      tenant.projectId,
    ),
  });

  return toCtaModule(raw, buildLocaleParams(tenant));
}
