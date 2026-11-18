import type { TMaybeUndefined } from '@shinefold/config';
import { SECTION_APPEARANCE_LOG } from '@web/constants/section-appearance';
import { getEffectiveEntitlements } from '@web/server/site-config/get-effective-entitlements/get-effective-entitlements';
import { getSiteConfigWithPreset } from '@web/server/site-config/get-site-config-with-preset/get-site-config-with-preset';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import type { TSectionAppearance } from '@web/utils/build-section-scope-declarations';
import {
  gateSectionStyleOverrides,
  type TSectionStyleOverrides,
} from '@web/utils/gate-section-style-overrides';

export const getSectionAppearance = async (
  tenantId: TMaybeUndefined<string>,
  overrides: TSectionStyleOverrides,
): Promise<TSectionAppearance> => {
  const tenant = tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER;
  const [{ row, preset }, entitlements] = await Promise.all([
    getSiteConfigWithPreset(
      SECTION_APPEARANCE_LOG.SITE_CONFIG_FETCH_FAILED,
      tenant,
    ),
    getEffectiveEntitlements(tenant),
  ]);

  return {
    overrides: gateSectionStyleOverrides(overrides, entitlements),
    look: {
      cardStyle: row?.cardStyle ?? preset.cardStyle,
      buttonShape: row?.buttonShape ?? preset.buttonShape,
    },
  };
};
