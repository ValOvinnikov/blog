import type * as TModule from '@web/server/site-config/get-footer-style/get-footer-style';
import { MOCK_FOOTER_STYLE } from '@web/testing/shared/footer-style/fixtures';

export const getFooterStyle = vi.fn<typeof TModule.getFooterStyle>(
  async () => MOCK_FOOTER_STYLE,
);
