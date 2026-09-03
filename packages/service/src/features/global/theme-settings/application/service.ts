import { getTheme } from '@blog/service/features/global/theme-settings/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createThemeSettingsService() {
  return {
    v1: {
      getTheme: safeAsync((tenant: TTenantSanityContext) => getTheme(tenant)),
    },
  };
}
