import ChevronRight from '@admin/assets/icons/chevron-right.svg';
import Comment from '@admin/assets/icons/comment.svg';
import Globe from '@admin/assets/icons/globe.svg';
import Grid from '@admin/assets/icons/grid.svg';
import Mail from '@admin/assets/icons/mail.svg';
import MenuRows from '@admin/assets/icons/menu-rows.svg';
import Menu from '@admin/assets/icons/menu.svg';
import Palette from '@admin/assets/icons/palette.svg';
import Plus from '@admin/assets/icons/plus.svg';
import Quote from '@admin/assets/icons/quote.svg';
import Settings from '@admin/assets/icons/settings.svg';
import Users from '@admin/assets/icons/users.svg';
import Warning from '@admin/assets/icons/warning.svg';
import { ICONS, type TIconName } from '@blog/config';
import type { FC, SVGProps } from 'react';

type TGlyph = FC<SVGProps<SVGSVGElement>>;

export const ICON_REGISTRY: Partial<Record<TIconName, TGlyph>> = {
  [ICONS.CHEVRON_RIGHT]: ChevronRight,
  [ICONS.COMMENT]: Comment,
  [ICONS.GLOBE]: Globe,
  [ICONS.GRID]: Grid,
  [ICONS.MAIL]: Mail,
  [ICONS.MENU]: Menu,
  [ICONS.MENU_ROWS]: MenuRows,
  [ICONS.PALETTE]: Palette,
  [ICONS.PLUS]: Plus,
  [ICONS.QUOTE]: Quote,
  [ICONS.SETTINGS]: Settings,
  [ICONS.USERS]: Users,
  [ICONS.WARNING]: Warning,
};
