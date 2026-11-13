import 'server-only';

import { isUndefined } from '@blog/utils/primitives';
import {
  SHINEFOLD_LOGO_VARIANT,
  shinefoldLogoSvg,
} from '@blog/utils/shinefold-logo';
import { ImageResponse } from 'next/og';

export const renderMarkPng = (side: number, background?: string) => {
  const markSvg = shinefoldLogoSvg(SHINEFOLD_LOGO_VARIANT.MARK, {
    width: side,
    height: side,
  });
  const markDataUri = `data:image/svg+xml;base64,${Buffer.from(markSvg).toString('base64')}`;

  // Satori throws on a style key set to undefined, so a transparent mark omits it.
  const fill = isUndefined(background) ? {} : { background };

  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', ...fill }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse rasterises plain elements; next/image never reaches it */}
      <img src={markDataUri} alt="" width={side} height={side} />
    </div>,
    { width: side, height: side },
  );
};
