import { ICONS, type TIconName } from '@shinefold/config';
import { type FC, type SVGProps } from 'react';

import ArrowUpComponent from '@shinefold/ui/assets/icons/arrow-up.svg';
import ArrowUpUrl from '@shinefold/ui/assets/icons/arrow-up.svg?url';
import ArrowComponent from '@shinefold/ui/assets/icons/arrow.svg';
import ArrowUrl from '@shinefold/ui/assets/icons/arrow.svg?url';
import BlueskyComponent from '@shinefold/ui/assets/icons/bluesky.svg';
import BlueskyUrl from '@shinefold/ui/assets/icons/bluesky.svg?url';
import BoldComponent from '@shinefold/ui/assets/icons/bold.svg';
import BoldUrl from '@shinefold/ui/assets/icons/bold.svg?url';
import BookComponent from '@shinefold/ui/assets/icons/book.svg';
import BookUrl from '@shinefold/ui/assets/icons/book.svg?url';
import BookmarkComponent from '@shinefold/ui/assets/icons/bookmark.svg';
import BookmarkUrl from '@shinefold/ui/assets/icons/bookmark.svg?url';
import CameraComponent from '@shinefold/ui/assets/icons/camera.svg';
import CameraUrl from '@shinefold/ui/assets/icons/camera.svg?url';
import ChartComponent from '@shinefold/ui/assets/icons/chart.svg';
import ChartUrl from '@shinefold/ui/assets/icons/chart.svg?url';
import CheckSheetComponent from '@shinefold/ui/assets/icons/check-sheet.svg';
import CheckSheetUrl from '@shinefold/ui/assets/icons/check-sheet.svg?url';
import CheckComponent from '@shinefold/ui/assets/icons/check.svg';
import CheckUrl from '@shinefold/ui/assets/icons/check.svg?url';
import ChevronDownComponent from '@shinefold/ui/assets/icons/chevron-down.svg';
import ChevronDownUrl from '@shinefold/ui/assets/icons/chevron-down.svg?url';
import ChevronLeftComponent from '@shinefold/ui/assets/icons/chevron-left.svg';
import ChevronLeftUrl from '@shinefold/ui/assets/icons/chevron-left.svg?url';
import ChevronRightComponent from '@shinefold/ui/assets/icons/chevron-right.svg';
import ChevronRightUrl from '@shinefold/ui/assets/icons/chevron-right.svg?url';
import ChevronUpComponent from '@shinefold/ui/assets/icons/chevron-up.svg';
import ChevronUpUrl from '@shinefold/ui/assets/icons/chevron-up.svg?url';
import ClockComponent from '@shinefold/ui/assets/icons/clock.svg';
import ClockUrl from '@shinefold/ui/assets/icons/clock.svg?url';
import CloseComponent from '@shinefold/ui/assets/icons/close.svg';
import CloseUrl from '@shinefold/ui/assets/icons/close.svg?url';
import CloudComponent from '@shinefold/ui/assets/icons/cloud.svg';
import CloudUrl from '@shinefold/ui/assets/icons/cloud.svg?url';
import CodeComponent from '@shinefold/ui/assets/icons/code.svg';
import CodeUrl from '@shinefold/ui/assets/icons/code.svg?url';
import CommentComponent from '@shinefold/ui/assets/icons/comment.svg';
import CommentUrl from '@shinefold/ui/assets/icons/comment.svg?url';
import CookieComponent from '@shinefold/ui/assets/icons/cookie.svg';
import CookieUrl from '@shinefold/ui/assets/icons/cookie.svg?url';
import CopyComponent from '@shinefold/ui/assets/icons/copy.svg';
import CopyUrl from '@shinefold/ui/assets/icons/copy.svg?url';
import CpuComponent from '@shinefold/ui/assets/icons/cpu.svg';
import CpuUrl from '@shinefold/ui/assets/icons/cpu.svg?url';
import CrosshairComponent from '@shinefold/ui/assets/icons/crosshair.svg';
import CrosshairUrl from '@shinefold/ui/assets/icons/crosshair.svg?url';
import ErrorComponent from '@shinefold/ui/assets/icons/error.svg';
import ErrorUrl from '@shinefold/ui/assets/icons/error.svg?url';
import ExternalLinkComponent from '@shinefold/ui/assets/icons/external-link.svg';
import ExternalLinkUrl from '@shinefold/ui/assets/icons/external-link.svg?url';
import EyeOffComponent from '@shinefold/ui/assets/icons/eye-off.svg';
import EyeOffUrl from '@shinefold/ui/assets/icons/eye-off.svg?url';
import EyeComponent from '@shinefold/ui/assets/icons/eye.svg';
import EyeUrl from '@shinefold/ui/assets/icons/eye.svg?url';
import FacebookComponent from '@shinefold/ui/assets/icons/facebook.svg';
import FacebookUrl from '@shinefold/ui/assets/icons/facebook.svg?url';
import GitHubComponent from '@shinefold/ui/assets/icons/github.svg';
import GitHubUrl from '@shinefold/ui/assets/icons/github.svg?url';
import GlobeComponent from '@shinefold/ui/assets/icons/globe.svg';
import GlobeUrl from '@shinefold/ui/assets/icons/globe.svg?url';
import GoogleComponent from '@shinefold/ui/assets/icons/google.svg';
import GoogleUrl from '@shinefold/ui/assets/icons/google.svg?url';
import GridComponent from '@shinefold/ui/assets/icons/grid.svg';
import GridUrl from '@shinefold/ui/assets/icons/grid.svg?url';
import HeartComponent from '@shinefold/ui/assets/icons/heart.svg';
import HeartUrl from '@shinefold/ui/assets/icons/heart.svg?url';
import HouseComponent from '@shinefold/ui/assets/icons/house.svg';
import HouseUrl from '@shinefold/ui/assets/icons/house.svg?url';
import InfoComponent from '@shinefold/ui/assets/icons/info.svg';
import InfoUrl from '@shinefold/ui/assets/icons/info.svg?url';
import InstagramComponent from '@shinefold/ui/assets/icons/instagram.svg';
import InstagramUrl from '@shinefold/ui/assets/icons/instagram.svg?url';
import ItalicComponent from '@shinefold/ui/assets/icons/italic.svg';
import ItalicUrl from '@shinefold/ui/assets/icons/italic.svg?url';
import LayersComponent from '@shinefold/ui/assets/icons/layers.svg';
import LayersUrl from '@shinefold/ui/assets/icons/layers.svg?url';
import LightbulbComponent from '@shinefold/ui/assets/icons/lightbulb.svg';
import LightbulbUrl from '@shinefold/ui/assets/icons/lightbulb.svg?url';
import LinkComponent from '@shinefold/ui/assets/icons/link.svg';
import LinkUrl from '@shinefold/ui/assets/icons/link.svg?url';
import LinkedInComponent from '@shinefold/ui/assets/icons/linkedin.svg';
import LinkedInUrl from '@shinefold/ui/assets/icons/linkedin.svg?url';
import LockComponent from '@shinefold/ui/assets/icons/lock.svg';
import LockUrl from '@shinefold/ui/assets/icons/lock.svg?url';
import MailComponent from '@shinefold/ui/assets/icons/mail.svg';
import MailUrl from '@shinefold/ui/assets/icons/mail.svg?url';
import MapPinComponent from '@shinefold/ui/assets/icons/map-pin.svg';
import MapPinUrl from '@shinefold/ui/assets/icons/map-pin.svg?url';
import MastodonComponent from '@shinefold/ui/assets/icons/mastodon.svg';
import MastodonUrl from '@shinefold/ui/assets/icons/mastodon.svg?url';
import MaximizeComponent from '@shinefold/ui/assets/icons/maximize.svg';
import MaximizeUrl from '@shinefold/ui/assets/icons/maximize.svg?url';
import MenuRowsComponent from '@shinefold/ui/assets/icons/menu-rows.svg';
import MenuRowsUrl from '@shinefold/ui/assets/icons/menu-rows.svg?url';
import MenuComponent from '@shinefold/ui/assets/icons/menu.svg';
import MenuUrl from '@shinefold/ui/assets/icons/menu.svg?url';
import MonitorComponent from '@shinefold/ui/assets/icons/monitor.svg';
import MonitorUrl from '@shinefold/ui/assets/icons/monitor.svg?url';
import MoonComponent from '@shinefold/ui/assets/icons/moon.svg';
import MoonUrl from '@shinefold/ui/assets/icons/moon.svg?url';
import PaletteComponent from '@shinefold/ui/assets/icons/palette.svg';
import PaletteUrl from '@shinefold/ui/assets/icons/palette.svg?url';
import PauseComponent from '@shinefold/ui/assets/icons/pause.svg';
import PauseUrl from '@shinefold/ui/assets/icons/pause.svg?url';
import PenComponent from '@shinefold/ui/assets/icons/pen.svg';
import PenUrl from '@shinefold/ui/assets/icons/pen.svg?url';
import PhoneComponent from '@shinefold/ui/assets/icons/phone.svg';
import PhoneUrl from '@shinefold/ui/assets/icons/phone.svg?url';
import PlusComponent from '@shinefold/ui/assets/icons/plus.svg';
import PlusUrl from '@shinefold/ui/assets/icons/plus.svg?url';
import PowerComponent from '@shinefold/ui/assets/icons/power.svg';
import PowerUrl from '@shinefold/ui/assets/icons/power.svg?url';
import QuoteComponent from '@shinefold/ui/assets/icons/quote.svg';
import QuoteUrl from '@shinefold/ui/assets/icons/quote.svg?url';
import RocketComponent from '@shinefold/ui/assets/icons/rocket.svg';
import RocketUrl from '@shinefold/ui/assets/icons/rocket.svg?url';
import RssComponent from '@shinefold/ui/assets/icons/rss.svg';
import RssUrl from '@shinefold/ui/assets/icons/rss.svg?url';
import SearchComponent from '@shinefold/ui/assets/icons/search.svg';
import SearchUrl from '@shinefold/ui/assets/icons/search.svg?url';
import SelectChevronComponent from '@shinefold/ui/assets/icons/select-chevron.svg';
import SelectChevronUrl from '@shinefold/ui/assets/icons/select-chevron.svg?url';
import SendComponent from '@shinefold/ui/assets/icons/send.svg';
import SendUrl from '@shinefold/ui/assets/icons/send.svg?url';
import SettingsComponent from '@shinefold/ui/assets/icons/settings.svg';
import SettingsUrl from '@shinefold/ui/assets/icons/settings.svg?url';
import ShareComponent from '@shinefold/ui/assets/icons/share.svg';
import ShareUrl from '@shinefold/ui/assets/icons/share.svg?url';
import ShieldCheckComponent from '@shinefold/ui/assets/icons/shield-check.svg';
import ShieldCheckUrl from '@shinefold/ui/assets/icons/shield-check.svg?url';
import SidebarComponent from '@shinefold/ui/assets/icons/sidebar.svg';
import SidebarUrl from '@shinefold/ui/assets/icons/sidebar.svg?url';
import SmileComponent from '@shinefold/ui/assets/icons/smile.svg';
import SmileUrl from '@shinefold/ui/assets/icons/smile.svg?url';
import SpinnerComponent from '@shinefold/ui/assets/icons/spinner.svg';
import SpinnerUrl from '@shinefold/ui/assets/icons/spinner.svg?url';
import StarComponent from '@shinefold/ui/assets/icons/star.svg';
import StarUrl from '@shinefold/ui/assets/icons/star.svg?url';
import StudioComponent from '@shinefold/ui/assets/icons/studio.svg';
import StudioUrl from '@shinefold/ui/assets/icons/studio.svg?url';
import SunComponent from '@shinefold/ui/assets/icons/sun.svg';
import SunUrl from '@shinefold/ui/assets/icons/sun.svg?url';
import TabletComponent from '@shinefold/ui/assets/icons/tablet.svg';
import TabletUrl from '@shinefold/ui/assets/icons/tablet.svg?url';
import TargetComponent from '@shinefold/ui/assets/icons/target.svg';
import TargetUrl from '@shinefold/ui/assets/icons/target.svg?url';
import ThreadsComponent from '@shinefold/ui/assets/icons/threads.svg';
import ThreadsUrl from '@shinefold/ui/assets/icons/threads.svg?url';
import TickComponent from '@shinefold/ui/assets/icons/tick.svg';
import TickUrl from '@shinefold/ui/assets/icons/tick.svg?url';
import TrendingUpComponent from '@shinefold/ui/assets/icons/trending-up.svg';
import TrendingUpUrl from '@shinefold/ui/assets/icons/trending-up.svg?url';
import UnfoldComponent from '@shinefold/ui/assets/icons/unfold.svg';
import UnfoldUrl from '@shinefold/ui/assets/icons/unfold.svg?url';
import UploadComponent from '@shinefold/ui/assets/icons/upload.svg';
import UploadUrl from '@shinefold/ui/assets/icons/upload.svg?url';
import UserCheckComponent from '@shinefold/ui/assets/icons/user-check.svg';
import UserCheckUrl from '@shinefold/ui/assets/icons/user-check.svg?url';
import UserComponent from '@shinefold/ui/assets/icons/user.svg';
import UserUrl from '@shinefold/ui/assets/icons/user.svg?url';
import UsersComponent from '@shinefold/ui/assets/icons/users.svg';
import UsersUrl from '@shinefold/ui/assets/icons/users.svg?url';
import WarningComponent from '@shinefold/ui/assets/icons/warning.svg';
import WarningUrl from '@shinefold/ui/assets/icons/warning.svg?url';
import WrenchComponent from '@shinefold/ui/assets/icons/wrench.svg';
import WrenchUrl from '@shinefold/ui/assets/icons/wrench.svg?url';
import XComponent from '@shinefold/ui/assets/icons/x.svg';
import XUrl from '@shinefold/ui/assets/icons/x.svg?url';
import YouTubeComponent from '@shinefold/ui/assets/icons/youtube.svg';
import YouTubeUrl from '@shinefold/ui/assets/icons/youtube.svg?url';
import ZapComponent from '@shinefold/ui/assets/icons/zap.svg';
import ZapUrl from '@shinefold/ui/assets/icons/zap.svg?url';

export type TIconRegistryEntry = {
  component: FC<SVGProps<SVGSVGElement>>;
  url: string;
};

/** `Icon` only reads `component`; `url` exists for future non-React uses (favicons, OG images). */
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
  [ICONS.CHEVRON_DOWN]: {
    component: ChevronDownComponent,
    url: ChevronDownUrl,
  },
  [ICONS.CHEVRON_UP]: { component: ChevronUpComponent, url: ChevronUpUrl },
  [ICONS.SELECT_CHEVRON]: {
    component: SelectChevronComponent,
    url: SelectChevronUrl,
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
  [ICONS.ERROR]: { component: ErrorComponent, url: ErrorUrl },
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
  [ICONS.USER]: { component: UserComponent, url: UserUrl },
  [ICONS.USERS]: { component: UsersComponent, url: UsersUrl },
  [ICONS.CODE]: { component: CodeComponent, url: CodeUrl },
  [ICONS.LAYERS]: { component: LayersComponent, url: LayersUrl },
  [ICONS.ZAP]: { component: ZapComponent, url: ZapUrl },
  [ICONS.SEARCH]: { component: SearchComponent, url: SearchUrl },
  [ICONS.CHART]: { component: ChartComponent, url: ChartUrl },
  [ICONS.CLOCK]: { component: ClockComponent, url: ClockUrl },
  [ICONS.COOKIE]: { component: CookieComponent, url: CookieUrl },
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
  [ICONS.BOLD]: { component: BoldComponent, url: BoldUrl },
  [ICONS.ITALIC]: { component: ItalicComponent, url: ItalicUrl },
  [ICONS.LINK]: { component: LinkComponent, url: LinkUrl },
  [ICONS.SMILE]: { component: SmileComponent, url: SmileUrl },
  [ICONS.SEND]: { component: SendComponent, url: SendUrl },
  [ICONS.UNFOLD]: { component: UnfoldComponent, url: UnfoldUrl },
  [ICONS.TICK]: { component: TickComponent, url: TickUrl },
  [ICONS.SIDEBAR]: { component: SidebarComponent, url: SidebarUrl },
  [ICONS.MONITOR]: { component: MonitorComponent, url: MonitorUrl },
  [ICONS.TABLET]: { component: TabletComponent, url: TabletUrl },
  [ICONS.USER_CHECK]: { component: UserCheckComponent, url: UserCheckUrl },
  [ICONS.CROSSHAIR]: { component: CrosshairComponent, url: CrosshairUrl },
  [ICONS.MAXIMIZE]: { component: MaximizeComponent, url: MaximizeUrl },
  [ICONS.PAUSE]: { component: PauseComponent, url: PauseUrl },
  [ICONS.UPLOAD]: { component: UploadComponent, url: UploadUrl },
  [ICONS.EYE]: { component: EyeComponent, url: EyeUrl },
  [ICONS.EYE_OFF]: { component: EyeOffComponent, url: EyeOffUrl },
};
