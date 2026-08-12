import { getTheme } from '@blog/service/features/global/theme-settings/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createThemeSettingsService() {
  return {
    v1: {
      getTheme: safeAsync(() => getTheme()),
    },
  };
}
