import { PRESET_ID, PRESET_REGISTRY, type IAccountControl } from '@blog/config';
import { ACCOUNT_CONTROL_LOG } from '@web/constants/account-control';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

export const getAccountControl = async (
  tenant?: string,
): Promise<IAccountControl> => {
  const result = await getSiteConfig(tenant);

  if (!result.ok) {
    logger.error(ACCOUNT_CONTROL_LOG.SITE_CONFIG_FETCH_FAILED, {
      error: result.error,
    });
  }

  const row = result.ok ? result.data : undefined;
  const preset = PRESET_REGISTRY[row?.preset ?? PRESET_ID.CONSOLE];

  return {
    buttonStyle: row?.accountButtonStyle ?? preset.accountButtonStyle,
    panelStyle: row?.accountPanelStyle ?? preset.accountPanelStyle,
    phonePlacement: row?.accountPhonePlacement ?? preset.accountPhonePlacement,
  };
};
