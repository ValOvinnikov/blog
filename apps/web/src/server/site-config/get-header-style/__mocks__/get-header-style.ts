import type * as TModule from '@web/server/site-config/get-header-style/get-header-style';
import { MOCK_HEADER_STYLE } from '@web/testing/shared/header-style/fixtures';

export const getHeaderStyle = vi.fn<typeof TModule.getHeaderStyle>(
  async () => MOCK_HEADER_STYLE,
);
