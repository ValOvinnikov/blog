import type * as TModule from '@web/server/site-config/get-account-control/get-account-control';
import { MOCK_ACCOUNT_CONTROL } from '@web/testing/shared/account-control/fixtures';

export const getAccountControl = vi.fn<typeof TModule.getAccountControl>(
  async () => MOCK_ACCOUNT_CONTROL,
);
