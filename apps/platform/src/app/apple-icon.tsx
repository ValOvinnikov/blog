import {
  SHINEFOLD_LOGO_COLOR,
  SHINEFOLD_LOGO_VARIANT,
  shinefoldLogoSvg,
} from '@blog/utils/shinefold-logo';
import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const MARK_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(
  shinefoldLogoSvg(SHINEFOLD_LOGO_VARIANT.MARK, size),
).toString('base64')}`;

// iOS rounds the corners itself, so the tile's own corners are filled in.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: SHINEFOLD_LOGO_COLOR.YELLOW,
      }}
    >
      <img src={MARK_DATA_URI} alt="" width={size.width} height={size.height} />
    </div>,
    size,
  );
}
