import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { heroProfileModuleQuery } from './query';
import { toHeroProfileModule } from './transformer';
import type { THeroProfileModule } from './types';

// The tags below cover the `link` document type and every page type the
// Profile Hero can actually be hosted on (`homePage`, `page_landing`), plus
// `author` for the dereferenced photo/social links — a renamed slug, an
// updated author photo, or an edited social link all invalidate this hero.
export async function getHeroProfile(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroProfileModule> {
  const raw = await runQuery(heroProfileModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:heroProfile',
        `module:${id}`,
        'author',
        'link',
        'homePage',
        'page_landing',
      ],
      tenant.projectId,
    ),
  });

  return toHeroProfileModule(raw);
}
