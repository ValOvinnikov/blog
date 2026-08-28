import { ICONS, type TIconName } from '@blog/config';
import CheckSheet from '@platform/assets/icons/check-sheet.svg';
import ChevronRight from '@platform/assets/icons/chevron-right.svg';
import Comment from '@platform/assets/icons/comment.svg';
import Globe from '@platform/assets/icons/globe.svg';
import Grid from '@platform/assets/icons/grid.svg';
import House from '@platform/assets/icons/house.svg';
import Mail from '@platform/assets/icons/mail.svg';
import MenuRows from '@platform/assets/icons/menu-rows.svg';
import Menu from '@platform/assets/icons/menu.svg';
import Palette from '@platform/assets/icons/palette.svg';
import Plus from '@platform/assets/icons/plus.svg';
import Quote from '@platform/assets/icons/quote.svg';
import Settings from '@platform/assets/icons/settings.svg';
import Users from '@platform/assets/icons/users.svg';
import Warning from '@platform/assets/icons/warning.svg';
import type { FC, SVGProps } from 'react';

type TGlyph = FC<SVGProps<SVGSVGElement>>;

export const ICON_REGISTRY: Partial<Record<TIconName, TGlyph>> = {
  [ICONS.CHECK_SHEET]: CheckSheet,
  [ICONS.CHEVRON_RIGHT]: ChevronRight,
  [ICONS.COMMENT]: Comment,
  [ICONS.GLOBE]: Globe,
  [ICONS.GRID]: Grid,
  [ICONS.HOUSE]: House,
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
