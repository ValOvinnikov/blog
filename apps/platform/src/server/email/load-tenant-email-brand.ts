import 'server-only';

import { lookFormValuesOrDefaults } from '@platform/utils/to-look-form-values/to-look-form-values';
import {
  resolveTenantEmailBrand,
  type TMaybeUndefined,
  type TTenantEmailBrand,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import type { TSiteConfigResult } from '@shinefold/db/queries/site-config';

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
