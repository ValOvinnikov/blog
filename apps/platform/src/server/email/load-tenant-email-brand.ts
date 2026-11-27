import 'server-only';

import { lookFormValuesOrDefaults } from '@platform/utils/to-look-form-values/to-look-form-values';
import {
  resolveTenantEmailBrand,
  resolveTenantEmailDarkBrand,
  type TMaybeUndefined,
  type TTenantEmailBrand,
} from '@shinefold/config';
import type { TFontChoice } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import type { TSiteConfigResult } from '@shinefold/db/queries/site-config';

export type TTenantEmailLook = {
  brand: TTenantEmailBrand;
  darkBrand: TTenantEmailBrand;
  headingFont: TFontChoice;
  bodyFont: TFontChoice;
};

export const toTenantEmailBrand = (
  siteConfig: TMaybeUndefined<TSiteConfigResult>,
): TTenantEmailLook => {
  const { preset, accentHue, logoHue, buttonColor, headingFont, bodyFont } =
    lookFormValuesOrDefaults(siteConfig);
  const brandInput = { preset, accentHue, logoHue, buttonColor };

  return {
    brand: resolveTenantEmailBrand(brandInput),
    darkBrand: resolveTenantEmailDarkBrand(brandInput),
    headingFont,
    bodyFont,
  };
};

export const loadTenantEmailBrand = async (
  tenantId: string,
): Promise<TTenantEmailLook> =>
  toTenantEmailBrand(await queries.siteConfig.getSiteConfig(tenantId));
