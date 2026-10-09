import { ICONS, type TIconName } from '@blog/config';
import Bold from '@platform/assets/icons/bold.svg';
import Book from '@platform/assets/icons/book.svg';
import CheckCircle from '@platform/assets/icons/check-circle.svg';
import CheckSheet from '@platform/assets/icons/check-sheet.svg';
import ChevronRight from '@platform/assets/icons/chevron-right.svg';
import Comment from '@platform/assets/icons/comment.svg';
import ErrorCircle from '@platform/assets/icons/error.svg';
import Globe from '@platform/assets/icons/globe.svg';
import Grid from '@platform/assets/icons/grid.svg';
import House from '@platform/assets/icons/house.svg';
import Info from '@platform/assets/icons/info.svg';
import Italic from '@platform/assets/icons/italic.svg';
import Link from '@platform/assets/icons/link.svg';
import Mail from '@platform/assets/icons/mail.svg';
import MenuRows from '@platform/assets/icons/menu-rows.svg';
import Menu from '@platform/assets/icons/menu.svg';
import Palette from '@platform/assets/icons/palette.svg';
import Plus from '@platform/assets/icons/plus.svg';
import Quote from '@platform/assets/icons/quote.svg';
import Settings from '@platform/assets/icons/settings.svg';
import Studio from '@platform/assets/icons/studio.svg';
import Users from '@platform/assets/icons/users.svg';
import Warning from '@platform/assets/icons/warning.svg';
import type { FC, SVGProps } from 'react';

type TGlyph = FC<SVGProps<SVGSVGElement>>;

export const ICON_REGISTRY: Partial<Record<TIconName, TGlyph>> = {
  [ICONS.BOLD]: Bold,
  [ICONS.BOOK]: Book,
  [ICONS.CHECK]: CheckCircle,
  [ICONS.CHECK_SHEET]: CheckSheet,
  [ICONS.CHEVRON_RIGHT]: ChevronRight,
  // The error notice's circled cross, the same key @blog/ui's Alert uses for ERROR.
  [ICONS.CLOSE]: ErrorCircle,
  [ICONS.COMMENT]: Comment,
  [ICONS.GLOBE]: Globe,
  [ICONS.GRID]: Grid,
  [ICONS.HOUSE]: House,
  [ICONS.INFO]: Info,
  [ICONS.ITALIC]: Italic,
  [ICONS.LINK]: Link,
  [ICONS.MAIL]: Mail,
  [ICONS.MENU]: Menu,
  [ICONS.MENU_ROWS]: MenuRows,
  [ICONS.PALETTE]: Palette,
  [ICONS.PLUS]: Plus,
  [ICONS.QUOTE]: Quote,
  [ICONS.SETTINGS]: Settings,
  [ICONS.STUDIO]: Studio,
  [ICONS.USERS]: Users,
  [ICONS.WARNING]: Warning,
};
