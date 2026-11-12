import { PRESET_ID, PRESET_REGISTRY, type TMaybeUndefined } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { SECTION_APPEARANCE_LOG } from '@web/constants/section-appearance';
import { getEffectivePlan } from '@web/server/site-config/get-effective-plan/get-effective-plan';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import type { TSectionAppearance } from '@web/utils/build-section-scope-declarations';
import {
  gateSectionStyleOverrides,
  type TSectionStyleOverrides,
} from '@web/utils/gate-section-style-overrides';
import { logger } from '@web/utils/logger/logger';

export const getSectionAppearance = async (
  tenantId: TMaybeUndefined<string>,
  overrides: TSectionStyleOverrides,
): Promise<TSectionAppearance> => {
  const [result, plan] = await Promise.all([
    getSiteConfig(tenantId),
    tenantId ? getEffectivePlan(tenantId) : TENANT_PLAN.FREE,
  ]);

  if (!result.ok) {
    logger.error(SECTION_APPEARANCE_LOG.SITE_CONFIG_FETCH_FAILED, {
      error: result.error,
    });
  }

  const row = result.ok ? result.data : undefined;
  const preset = PRESET_REGISTRY[row?.preset ?? PRESET_ID.CONSOLE];

  return {
    overrides: gateSectionStyleOverrides(overrides, plan),
    look: {
      cardStyle: row?.cardStyle ?? preset.cardStyle,
      buttonShape: row?.buttonShape ?? preset.buttonShape,
    },
  };
};
