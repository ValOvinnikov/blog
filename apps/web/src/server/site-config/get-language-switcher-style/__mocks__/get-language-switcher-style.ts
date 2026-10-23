import { LANGUAGE_SWITCHER_STYLE } from '@blog/config';
import type * as TModule from '@web/server/site-config/get-language-switcher-style/get-language-switcher-style';

export const getLanguageSwitcherStyle = vi.fn<
  typeof TModule.getLanguageSwitcherStyle
>(async () => LANGUAGE_SWITCHER_STYLE.MENU_CODE);
