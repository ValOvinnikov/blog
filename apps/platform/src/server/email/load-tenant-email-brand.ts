import 'server-only';

import { resolveTenantEmailBrand } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenantEmailBrand } from '@blog/email/html';
import { lookFormValuesOrDefaults } from '@platform/utils/default-look-values/default-look-values';

export const loadTenantEmailBrand = async (
  tenantId: string,
): Promise<TTenantEmailBrand> => {
  const siteConfig = await queries.siteConfig.getSiteConfig(tenantId);
  const { preset, accentHue, logoHue } = lookFormValuesOrDefaults(siteConfig);

  return resolveTenantEmailBrand({ preset, accentHue, logoHue });
};
