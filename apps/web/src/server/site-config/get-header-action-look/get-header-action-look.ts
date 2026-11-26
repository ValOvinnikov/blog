import type { TPrimaryNavigationAction } from '@shinefold/ui/components/molecules/primary-navigation';
import { HEADER_ACTION_LOG } from '@web/constants/header-action';
import { getSiteConfigWithPreset } from '@web/server/site-config/get-site-config-with-preset/get-site-config-with-preset';

export type THeaderActionLook = Required<
  Pick<TPrimaryNavigationAction, 'style' | 'phonePlacement'>
>;

export const getHeaderActionLook = async (
  tenant?: string,
): Promise<THeaderActionLook> => {
  const { row, preset } = await getSiteConfigWithPreset(
    HEADER_ACTION_LOG.SITE_CONFIG_FETCH_FAILED,
    tenant,
  );

  return {
    style: row?.headerActionStyle ?? preset.headerActionStyle,
    phonePlacement:
      row?.headerActionPhonePlacement ?? preset.headerActionPhonePlacement,
  };
};
