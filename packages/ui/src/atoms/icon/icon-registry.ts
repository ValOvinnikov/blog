import { ICONS, type TIconName } from '@blog/config';
import { type FC, type SVGProps } from 'react';

import ArrowUpComponent from '@blog/ui/assets/icons/arrow-up.svg';
import ArrowUpUrl from '@blog/ui/assets/icons/arrow-up.svg?url';
import ArrowComponent from '@blog/ui/assets/icons/arrow.svg';
import ArrowUrl from '@blog/ui/assets/icons/arrow.svg?url';
import BlueskyComponent from '@blog/ui/assets/icons/bluesky.svg';
import BlueskyUrl from '@blog/ui/assets/icons/bluesky.svg?url';
import BookComponent from '@blog/ui/assets/icons/book.svg';
import BookUrl from '@blog/ui/assets/icons/book.svg?url';
import BookmarkComponent from '@blog/ui/assets/icons/bookmark.svg';
import BookmarkUrl from '@blog/ui/assets/icons/bookmark.svg?url';
import CameraComponent from '@blog/ui/assets/icons/camera.svg';
import CameraUrl from '@blog/ui/assets/icons/camera.svg?url';
import ChartComponent from '@blog/ui/assets/icons/chart.svg';
import ChartUrl from '@blog/ui/assets/icons/chart.svg?url';
import CheckSheetComponent from '@blog/ui/assets/icons/check-sheet.svg';
import CheckSheetUrl from '@blog/ui/assets/icons/check-sheet.svg?url';
import CheckComponent from '@blog/ui/assets/icons/check.svg';
import CheckUrl from '@blog/ui/assets/icons/check.svg?url';
import ChevronLeftComponent from '@blog/ui/assets/icons/chevron-left.svg';
import ChevronLeftUrl from '@blog/ui/assets/icons/chevron-left.svg?url';
import ChevronRightComponent from '@blog/ui/assets/icons/chevron-right.svg';
import ChevronRightUrl from '@blog/ui/assets/icons/chevron-right.svg?url';
import ClockComponent from '@blog/ui/assets/icons/clock.svg';
import ClockUrl from '@blog/ui/assets/icons/clock.svg?url';
import CloseComponent from '@blog/ui/assets/icons/close.svg';
import CloseUrl from '@blog/ui/assets/icons/close.svg?url';
import CloudComponent from '@blog/ui/assets/icons/cloud.svg';
import CloudUrl from '@blog/ui/assets/icons/cloud.svg?url';
import CodeComponent from '@blog/ui/assets/icons/code.svg';
import CodeUrl from '@blog/ui/assets/icons/code.svg?url';
import CommentComponent from '@blog/ui/assets/icons/comment.svg';
import CommentUrl from '@blog/ui/assets/icons/comment.svg?url';
import CopyComponent from '@blog/ui/assets/icons/copy.svg';
import CopyUrl from '@blog/ui/assets/icons/copy.svg?url';
import CpuComponent from '@blog/ui/assets/icons/cpu.svg';
import CpuUrl from '@blog/ui/assets/icons/cpu.svg?url';
import ExternalLinkComponent from '@blog/ui/assets/icons/external-link.svg';
import ExternalLinkUrl from '@blog/ui/assets/icons/external-link.svg?url';
import FacebookComponent from '@blog/ui/assets/icons/facebook.svg';
import FacebookUrl from '@blog/ui/assets/icons/facebook.svg?url';
import GitHubComponent from '@blog/ui/assets/icons/github.svg';
import GitHubUrl from '@blog/ui/assets/icons/github.svg?url';
import GlobeComponent from '@blog/ui/assets/icons/globe.svg';
import GlobeUrl from '@blog/ui/assets/icons/globe.svg?url';
import GoogleComponent from '@blog/ui/assets/icons/google.svg';
import GoogleUrl from '@blog/ui/assets/icons/google.svg?url';
import GridComponent from '@blog/ui/assets/icons/grid.svg';
import GridUrl from '@blog/ui/assets/icons/grid.svg?url';
import HeartComponent from '@blog/ui/assets/icons/heart.svg';
import HeartUrl from '@blog/ui/assets/icons/heart.svg?url';
import HouseComponent from '@blog/ui/assets/icons/house.svg';
import HouseUrl from '@blog/ui/assets/icons/house.svg?url';
import InfoComponent from '@blog/ui/assets/icons/info.svg';
import InfoUrl from '@blog/ui/assets/icons/info.svg?url';
import InstagramComponent from '@blog/ui/assets/icons/instagram.svg';
import InstagramUrl from '@blog/ui/assets/icons/instagram.svg?url';
import LayersComponent from '@blog/ui/assets/icons/layers.svg';
import LayersUrl from '@blog/ui/assets/icons/layers.svg?url';
import LightbulbComponent from '@blog/ui/assets/icons/lightbulb.svg';
import LightbulbUrl from '@blog/ui/assets/icons/lightbulb.svg?url';
import LinkedInComponent from '@blog/ui/assets/icons/linkedin.svg';
import LinkedInUrl from '@blog/ui/assets/icons/linkedin.svg?url';
import LockComponent from '@blog/ui/assets/icons/lock.svg';
import LockUrl from '@blog/ui/assets/icons/lock.svg?url';
import MailComponent from '@blog/ui/assets/icons/mail.svg';
import MailUrl from '@blog/ui/assets/icons/mail.svg?url';
import MapPinComponent from '@blog/ui/assets/icons/map-pin.svg';
import MapPinUrl from '@blog/ui/assets/icons/map-pin.svg?url';
import MastodonComponent from '@blog/ui/assets/icons/mastodon.svg';
import MastodonUrl from '@blog/ui/assets/icons/mastodon.svg?url';
import MenuRowsComponent from '@blog/ui/assets/icons/menu-rows.svg';
import MenuRowsUrl from '@blog/ui/assets/icons/menu-rows.svg?url';
import MenuComponent from '@blog/ui/assets/icons/menu.svg';
import MenuUrl from '@blog/ui/assets/icons/menu.svg?url';
import MoonComponent from '@blog/ui/assets/icons/moon.svg';
import MoonUrl from '@blog/ui/assets/icons/moon.svg?url';
import PaletteComponent from '@blog/ui/assets/icons/palette.svg';
import PaletteUrl from '@blog/ui/assets/icons/palette.svg?url';
import PenComponent from '@blog/ui/assets/icons/pen.svg';
import PenUrl from '@blog/ui/assets/icons/pen.svg?url';
import PhoneComponent from '@blog/ui/assets/icons/phone.svg';
import PhoneUrl from '@blog/ui/assets/icons/phone.svg?url';
import PlusComponent from '@blog/ui/assets/icons/plus.svg';
import PlusUrl from '@blog/ui/assets/icons/plus.svg?url';
import PowerComponent from '@blog/ui/assets/icons/power.svg';
import PowerUrl from '@blog/ui/assets/icons/power.svg?url';
import QuoteComponent from '@blog/ui/assets/icons/quote.svg';
import QuoteUrl from '@blog/ui/assets/icons/quote.svg?url';
import RocketComponent from '@blog/ui/assets/icons/rocket.svg';
import RocketUrl from '@blog/ui/assets/icons/rocket.svg?url';
import RssComponent from '@blog/ui/assets/icons/rss.svg';
import RssUrl from '@blog/ui/assets/icons/rss.svg?url';
import SearchComponent from '@blog/ui/assets/icons/search.svg';
import SearchUrl from '@blog/ui/assets/icons/search.svg?url';
import SettingsComponent from '@blog/ui/assets/icons/settings.svg';
import SettingsUrl from '@blog/ui/assets/icons/settings.svg?url';
import ShareComponent from '@blog/ui/assets/icons/share.svg';
import ShareUrl from '@blog/ui/assets/icons/share.svg?url';
import ShieldCheckComponent from '@blog/ui/assets/icons/shield-check.svg';
import ShieldCheckUrl from '@blog/ui/assets/icons/shield-check.svg?url';
import SmileComponent from '@blog/ui/assets/icons/smile.svg';
import SmileUrl from '@blog/ui/assets/icons/smile.svg?url';
import SpinnerComponent from '@blog/ui/assets/icons/spinner.svg';
import SpinnerUrl from '@blog/ui/assets/icons/spinner.svg?url';
import StarComponent from '@blog/ui/assets/icons/star.svg';
import StarUrl from '@blog/ui/assets/icons/star.svg?url';
import StudioComponent from '@blog/ui/assets/icons/studio.svg';
import StudioUrl from '@blog/ui/assets/icons/studio.svg?url';
import SunComponent from '@blog/ui/assets/icons/sun.svg';
import SunUrl from '@blog/ui/assets/icons/sun.svg?url';
import TargetComponent from '@blog/ui/assets/icons/target.svg';
import TargetUrl from '@blog/ui/assets/icons/target.svg?url';
import ThreadsComponent from '@blog/ui/assets/icons/threads.svg';
import ThreadsUrl from '@blog/ui/assets/icons/threads.svg?url';
import TrendingUpComponent from '@blog/ui/assets/icons/trending-up.svg';
import TrendingUpUrl from '@blog/ui/assets/icons/trending-up.svg?url';
import UsersComponent from '@blog/ui/assets/icons/users.svg';
import UsersUrl from '@blog/ui/assets/icons/users.svg?url';
import WarningComponent from '@blog/ui/assets/icons/warning.svg';
import WarningUrl from '@blog/ui/assets/icons/warning.svg?url';
import WrenchComponent from '@blog/ui/assets/icons/wrench.svg';
import WrenchUrl from '@blog/ui/assets/icons/wrench.svg?url';
import XComponent from '@blog/ui/assets/icons/x.svg';
import XUrl from '@blog/ui/assets/icons/x.svg?url';
import YouTubeComponent from '@blog/ui/assets/icons/youtube.svg';
import YouTubeUrl from '@blog/ui/assets/icons/youtube.svg?url';
import ZapComponent from '@blog/ui/assets/icons/zap.svg';
import ZapUrl from '@blog/ui/assets/icons/zap.svg?url';

export type TIconRegistryEntry = {
  component: FC<SVGProps<SVGSVGElement>>;
  url: string;
};

/**
 * Maps every `TIconName` to both its SVGR React component (for rendering)
 * and its raw asset URL (for non-React uses like favicons/OG images). The
 * `Icon` atom only reads `component`; `url` exists for future asset-URL
 * consumers.
 */
export const ICON_REGISTRY: Record<TIconName, TIconRegistryEntry> = {
  [ICONS.SUN]: { component: SunComponent, url: SunUrl },
  [ICONS.MOON]: { component: MoonComponent, url: MoonUrl },
  [ICONS.SHARE]: { component: ShareComponent, url: ShareUrl },
  [ICONS.COPY]: { component: CopyComponent, url: CopyUrl },
  [ICONS.CHECK]: { component: CheckComponent, url: CheckUrl },
  [ICONS.CHECK_SHEET]: { component: CheckSheetComponent, url: CheckSheetUrl },
  [ICONS.CHEVRON_LEFT]: {
    component: ChevronLeftComponent,
    url: ChevronLeftUrl,
  },
  [ICONS.CHEVRON_RIGHT]: {
    component: ChevronRightComponent,
    url: ChevronRightUrl,
  },
  [ICONS.EXTERNAL_LINK]: {
    component: ExternalLinkComponent,
    url: ExternalLinkUrl,
  },
  [ICONS.MENU]: { component: MenuComponent, url: MenuUrl },
  [ICONS.MENU_ROWS]: { component: MenuRowsComponent, url: MenuRowsUrl },
  [ICONS.CLOSE]: { component: CloseComponent, url: CloseUrl },
  [ICONS.X]: { component: XComponent, url: XUrl },
  [ICONS.GITHUB]: { component: GitHubComponent, url: GitHubUrl },
  [ICONS.HOUSE]: { component: HouseComponent, url: HouseUrl },
  [ICONS.LINKEDIN]: { component: LinkedInComponent, url: LinkedInUrl },
  [ICONS.FACEBOOK]: { component: FacebookComponent, url: FacebookUrl },
  [ICONS.YOUTUBE]: { component: YouTubeComponent, url: YouTubeUrl },
  [ICONS.INSTAGRAM]: { component: InstagramComponent, url: InstagramUrl },
  [ICONS.MASTODON]: { component: MastodonComponent, url: MastodonUrl },
  [ICONS.BLUESKY]: { component: BlueskyComponent, url: BlueskyUrl },
  [ICONS.THREADS]: { component: ThreadsComponent, url: ThreadsUrl },
  [ICONS.RSS]: { component: RssComponent, url: RssUrl },
  [ICONS.ARROW_UP]: { component: ArrowUpComponent, url: ArrowUpUrl },
  [ICONS.ARROW]: { component: ArrowComponent, url: ArrowUrl },
  [ICONS.GOOGLE]: { component: GoogleComponent, url: GoogleUrl },
  [ICONS.BOOKMARK]: { component: BookmarkComponent, url: BookmarkUrl },
  [ICONS.SPINNER]: { component: SpinnerComponent, url: SpinnerUrl },
  [ICONS.WARNING]: { component: WarningComponent, url: WarningUrl },
  [ICONS.INFO]: { component: InfoComponent, url: InfoUrl },
  [ICONS.SETTINGS]: { component: SettingsComponent, url: SettingsUrl },
  [ICONS.POWER]: { component: PowerComponent, url: PowerUrl },
  [ICONS.MAIL]: { component: MailComponent, url: MailUrl },
  [ICONS.SHIELD_CHECK]: {
    component: ShieldCheckComponent,
    url: ShieldCheckUrl,
  },
  [ICONS.GRID]: { component: GridComponent, url: GridUrl },
  [ICONS.PLUS]: { component: PlusComponent, url: PlusUrl },
  [ICONS.PALETTE]: { component: PaletteComponent, url: PaletteUrl },
  [ICONS.QUOTE]: { component: QuoteComponent, url: QuoteUrl },
  [ICONS.GLOBE]: { component: GlobeComponent, url: GlobeUrl },
  [ICONS.STUDIO]: { component: StudioComponent, url: StudioUrl },
  [ICONS.COMMENT]: { component: CommentComponent, url: CommentUrl },
  [ICONS.USERS]: { component: UsersComponent, url: UsersUrl },
  [ICONS.CODE]: { component: CodeComponent, url: CodeUrl },
  [ICONS.LAYERS]: { component: LayersComponent, url: LayersUrl },
  [ICONS.ZAP]: { component: ZapComponent, url: ZapUrl },
  [ICONS.SEARCH]: { component: SearchComponent, url: SearchUrl },
  [ICONS.CHART]: { component: ChartComponent, url: ChartUrl },
  [ICONS.CLOCK]: { component: ClockComponent, url: ClockUrl },
  [ICONS.WRENCH]: { component: WrenchComponent, url: WrenchUrl },
  [ICONS.ROCKET]: { component: RocketComponent, url: RocketUrl },
  [ICONS.BOOK]: { component: BookComponent, url: BookUrl },
  [ICONS.PEN]: { component: PenComponent, url: PenUrl },
  [ICONS.STAR]: { component: StarComponent, url: StarUrl },
  [ICONS.LOCK]: { component: LockComponent, url: LockUrl },
  [ICONS.CLOUD]: { component: CloudComponent, url: CloudUrl },
  [ICONS.CPU]: { component: CpuComponent, url: CpuUrl },
  [ICONS.TARGET]: { component: TargetComponent, url: TargetUrl },
  [ICONS.HEART]: { component: HeartComponent, url: HeartUrl },
  [ICONS.CAMERA]: { component: CameraComponent, url: CameraUrl },
  [ICONS.LIGHTBULB]: { component: LightbulbComponent, url: LightbulbUrl },
  [ICONS.MAP_PIN]: { component: MapPinComponent, url: MapPinUrl },
  [ICONS.PHONE]: { component: PhoneComponent, url: PhoneUrl },
  [ICONS.TRENDING_UP]: { component: TrendingUpComponent, url: TrendingUpUrl },
  [ICONS.SMILE]: { component: SmileComponent, url: SmileUrl },
};
