import 'server-only';

import { resolveTenantEmailBrand, type TMaybeUndefined } from '@blog/config';
import { queries } from '@blog/db';
import type { TSiteConfigResult } from '@blog/db/queries/site-config';
import type { TTenantEmailBrand } from '@blog/email/html';
import { lookFormValuesOrDefaults } from '@platform/utils/default-look-values/default-look-values';

export const toTenantEmailBrand = (
  siteConfig: TMaybeUndefined<TSiteConfigResult>,
): TTenantEmailBrand => {
  const { preset, accentHue, logoHue } = lookFormValuesOrDefaults(siteConfig);

  return resolveTenantEmailBrand({ preset, accentHue, logoHue });
};

export const loadTenantEmailBrand = async (
  tenantId: string,
): Promise<TTenantEmailBrand> =>
  toTenantEmailBrand(await queries.siteConfig.getSiteConfig(tenantId));
