import type * as TModule from '@web/server/site-config/get-header-action-look/get-header-action-look';
import { MOCK_HEADER_ACTION_LOOK } from '@web/testing/shared/header-action/fixtures';

export const getHeaderActionLook = vi.fn<typeof TModule.getHeaderActionLook>(
  async () => MOCK_HEADER_ACTION_LOOK,
);
