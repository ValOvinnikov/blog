import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { heroStatementModuleQuery } from './query';
import { toHeroStatementModule } from './transformer';
import type { THeroStatementModule } from './types';

export async function getHeroStatement(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroStatementModule> {
  const raw = await runQuery(heroStatementModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:heroStatement', `module:${id}`, 'link'], tenant.projectId),
  });

  return toHeroStatementModule(raw);
}
