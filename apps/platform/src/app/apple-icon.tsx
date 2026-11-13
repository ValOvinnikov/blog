import { SHINEFOLD_LOGO_COLOR } from '@blog/utils/shinefold-logo';
import { renderMarkPng } from '@platform/server/icons/render-mark-png';

const APPLE_ICON_SIDE = 180;

export const size = { width: APPLE_ICON_SIDE, height: APPLE_ICON_SIDE };
export const contentType = 'image/png';

// iOS rounds the corners itself, so the tile's own corners are filled in.
export default function AppleIcon() {
  return renderMarkPng(APPLE_ICON_SIDE, SHINEFOLD_LOGO_COLOR.YELLOW);
}
