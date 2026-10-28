import type * as TModule from '@web/server/site-config/get-header-settings/get-header-settings';
import { MOCK_HEADER_SETTINGS } from '@web/testing/shared/header-settings/fixtures';

export const getHeaderSettings = vi.fn<typeof TModule.getHeaderSettings>(
  async () => MOCK_HEADER_SETTINGS,
);
