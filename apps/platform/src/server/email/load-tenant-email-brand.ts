import 'server-only';

import { resolveTenantEmailBrand } from '@blog/config';
import { queries } from '@blog/db';
import type { TTenantEmailBrand } from '@blog/email/html';
import {
  defaultLookFormValues,
  toLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';

export const loadTenantEmailBrand = async (
  tenantId: string,
): Promise<TTenantEmailBrand> => {
  const siteConfig = await queries.siteConfig.getSiteConfig(tenantId);
  const { preset, accentHue, logoHue } = siteConfig
    ? toLookFormValues(siteConfig)
    : defaultLookFormValues();

  return resolveTenantEmailBrand({ preset, accentHue, logoHue });
};
