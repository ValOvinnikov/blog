import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { landingPageQuery } from './query';
import { toLandingPage } from './transformer';
import type { TLandingPageDocument } from './types';

export async function getPageDocument(
  segments: string[],
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TLandingPageDocument>> {
  const slug = segments.at(-1);
  if (!slug) return undefined;

  const raw = await runQuery(landingPageQuery, {
    parameters: { slug, path: segments.join('/') },
    tenant,
    ...isr(['page_landing', 'template_landing'], tenant.projectId),
  });
  if (!raw) return undefined;

  return toLandingPage(raw);
}
