import type * as TModule from '@web/server/site-config/get-busy-style/get-busy-style';
import { MOCK_BUSY_STYLE } from '@web/testing/shared/busy-style/fixtures';

export const getBusyStyle = vi.fn<typeof TModule.getBusyStyle>(
  async () => MOCK_BUSY_STYLE,
);
