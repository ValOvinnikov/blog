import type { IAccountControl } from '@blog/config';
import { ACCOUNT_CONTROL_LOG } from '@web/constants/account-control';
import { getSiteConfigWithPreset } from '@web/server/site-config/get-site-config-with-preset/get-site-config-with-preset';

export const getAccountControl = async (
  tenant?: string,
): Promise<IAccountControl> => {
  const { row, preset } = await getSiteConfigWithPreset(
    ACCOUNT_CONTROL_LOG.SITE_CONFIG_FETCH_FAILED,
    tenant,
  );

  return {
    buttonStyle: row?.accountButtonStyle ?? preset.accountButtonStyle,
    panelStyle: row?.accountPanelStyle ?? preset.accountPanelStyle,
    phonePlacement: row?.accountPhonePlacement ?? preset.accountPhonePlacement,
  };
};
