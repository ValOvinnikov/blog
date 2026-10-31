import { ICONS, type TIconName } from '@blog/config';
import ArrowUp from '@platform/assets/icons/arrow-up.svg';
import Arrow from '@platform/assets/icons/arrow.svg';
import Bold from '@platform/assets/icons/bold.svg';
import Book from '@platform/assets/icons/book.svg';
import CheckCircle from '@platform/assets/icons/check-circle.svg';
import CheckSheet from '@platform/assets/icons/check-sheet.svg';
import ChevronDown from '@platform/assets/icons/chevron-down.svg';
import ChevronRight from '@platform/assets/icons/chevron-right.svg';
import ChevronUp from '@platform/assets/icons/chevron-up.svg';
import Clock from '@platform/assets/icons/clock.svg';
import Comment from '@platform/assets/icons/comment.svg';
import Crosshair from '@platform/assets/icons/crosshair.svg';
import ErrorExclamation from '@platform/assets/icons/error-exclamation.svg';
import ErrorCircle from '@platform/assets/icons/error.svg';
import ExternalLink from '@platform/assets/icons/external-link.svg';
import GitHub from '@platform/assets/icons/github.svg';
import Globe from '@platform/assets/icons/globe.svg';
import Google from '@platform/assets/icons/google.svg';
import Grid from '@platform/assets/icons/grid.svg';
import House from '@platform/assets/icons/house.svg';
import Info from '@platform/assets/icons/info.svg';
import Italic from '@platform/assets/icons/italic.svg';
import Layers from '@platform/assets/icons/layers.svg';
import Link from '@platform/assets/icons/link.svg';
import Lock from '@platform/assets/icons/lock.svg';
import Mail from '@platform/assets/icons/mail.svg';
import Maximize from '@platform/assets/icons/maximize.svg';
import MenuRows from '@platform/assets/icons/menu-rows.svg';
import Menu from '@platform/assets/icons/menu.svg';
import Monitor from '@platform/assets/icons/monitor.svg';
import Moon from '@platform/assets/icons/moon.svg';
import Palette from '@platform/assets/icons/palette.svg';
import Pause from '@platform/assets/icons/pause.svg';
import Phone from '@platform/assets/icons/phone.svg';
import Plus from '@platform/assets/icons/plus.svg';
import Power from '@platform/assets/icons/power.svg';
import Quote from '@platform/assets/icons/quote.svg';
import Rocket from '@platform/assets/icons/rocket.svg';
import Send from '@platform/assets/icons/send.svg';
import Settings from '@platform/assets/icons/settings.svg';
import ShieldCheck from '@platform/assets/icons/shield-check.svg';
import Sidebar from '@platform/assets/icons/sidebar.svg';
import Studio from '@platform/assets/icons/studio.svg';
import Sun from '@platform/assets/icons/sun.svg';
import Tablet from '@platform/assets/icons/tablet.svg';
import Tick from '@platform/assets/icons/tick.svg';
import Unfold from '@platform/assets/icons/unfold.svg';
import UserCheck from '@platform/assets/icons/user-check.svg';
import User from '@platform/assets/icons/user.svg';
import Users from '@platform/assets/icons/users.svg';
import Warning from '@platform/assets/icons/warning.svg';
import X from '@platform/assets/icons/x.svg';
import Zap from '@platform/assets/icons/zap.svg';
import type { FC, SVGProps } from 'react';

type TGlyph = FC<SVGProps<SVGSVGElement>>;

export const ICON_REGISTRY = {
  [ICONS.ARROW]: Arrow,
  [ICONS.ARROW_UP]: ArrowUp,
  [ICONS.BOLD]: Bold,
  [ICONS.BOOK]: Book,
  [ICONS.CHECK]: CheckCircle,
  [ICONS.CHECK_SHEET]: CheckSheet,
  [ICONS.CHEVRON_DOWN]: ChevronDown,
  [ICONS.CHEVRON_RIGHT]: ChevronRight,
  [ICONS.CHEVRON_UP]: ChevronUp,
  [ICONS.CLOCK]: Clock,
  // The error notice's circled cross, the same key @blog/ui's Alert uses for ERROR.
  [ICONS.CLOSE]: ErrorCircle,
  [ICONS.COMMENT]: Comment,
  [ICONS.CROSSHAIR]: Crosshair,
  [ICONS.ERROR]: ErrorExclamation,
  [ICONS.EXTERNAL_LINK]: ExternalLink,
  [ICONS.GITHUB]: GitHub,
  [ICONS.GLOBE]: Globe,
  [ICONS.GOOGLE]: Google,
  [ICONS.GRID]: Grid,
  [ICONS.HOUSE]: House,
  [ICONS.INFO]: Info,
  [ICONS.ITALIC]: Italic,
  [ICONS.LAYERS]: Layers,
  [ICONS.LINK]: Link,
  [ICONS.LOCK]: Lock,
  [ICONS.MAIL]: Mail,
  [ICONS.MAXIMIZE]: Maximize,
  [ICONS.MENU]: Menu,
  [ICONS.MENU_ROWS]: MenuRows,
  [ICONS.MONITOR]: Monitor,
  [ICONS.MOON]: Moon,
  [ICONS.PALETTE]: Palette,
  [ICONS.PAUSE]: Pause,
  [ICONS.PHONE]: Phone,
  [ICONS.PLUS]: Plus,
  [ICONS.POWER]: Power,
  [ICONS.QUOTE]: Quote,
  [ICONS.ROCKET]: Rocket,
  [ICONS.SEND]: Send,
  [ICONS.SETTINGS]: Settings,
  [ICONS.SHIELD_CHECK]: ShieldCheck,
  [ICONS.SIDEBAR]: Sidebar,
  [ICONS.STUDIO]: Studio,
  [ICONS.SUN]: Sun,
  [ICONS.TABLET]: Tablet,
  [ICONS.TICK]: Tick,
  [ICONS.UNFOLD]: Unfold,
  [ICONS.USER]: User,
  [ICONS.USERS]: Users,
  [ICONS.USER_CHECK]: UserCheck,
  [ICONS.WARNING]: Warning,
  [ICONS.X]: X,
  [ICONS.ZAP]: Zap,
} as const satisfies Partial<Record<TIconName, TGlyph>>;

export type TRegisteredIconName = keyof typeof ICON_REGISTRY;
