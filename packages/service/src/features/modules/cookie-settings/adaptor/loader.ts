import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { cookieSettingsModuleQuery } from './query';
import { toCookieSettingsModule } from './transformer';
import type { TCookieSettingsModule } from './types';

export async function getCookieSettings(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TCookieSettingsModule> {
  const raw = await runQuery(cookieSettingsModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:cookieSettings', `module:${id}`], tenant.projectId),
  });

  return toCookieSettingsModule(raw);
}
