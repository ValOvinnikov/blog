import type { TMaybeUndefined } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { SECTION_APPEARANCE_LOG } from '@web/constants/section-appearance';
import { getEffectivePlan } from '@web/server/site-config/get-effective-plan/get-effective-plan';
import { getSiteConfigWithPreset } from '@web/server/site-config/get-site-config-with-preset/get-site-config-with-preset';
import type { TSectionAppearance } from '@web/utils/build-section-scope-declarations';
import {
  gateSectionStyleOverrides,
  type TSectionStyleOverrides,
} from '@web/utils/gate-section-style-overrides';

export const getSectionAppearance = async (
  tenantId: TMaybeUndefined<string>,
  overrides: TSectionStyleOverrides,
): Promise<TSectionAppearance> => {
  const [{ row, preset }, plan] = await Promise.all([
    getSiteConfigWithPreset(
      SECTION_APPEARANCE_LOG.SITE_CONFIG_FETCH_FAILED,
      tenantId,
    ),
    tenantId ? getEffectivePlan(tenantId) : TENANT_PLAN.FREE,
  ]);

  return {
    overrides: gateSectionStyleOverrides(overrides, plan),
    look: {
      cardStyle: row?.cardStyle ?? preset.cardStyle,
      buttonShape: row?.buttonShape ?? preset.buttonShape,
    },
  };
};
