// Banner overlay scrims — fixed oklch stops, independent of theme, so the
// same value applies in light and dark (unlike token-based colors elsewhere
// in this package). Each family's darkest stop tracks where the text sits:
// the base export fades dark-to-light left-to-right (for LEFT-positioned
// text), the _RIGHT variant mirrors it (255deg = 360 - 105, the same tilt
// reflected horizontally), and the _CENTER variant applies the darkest stop
// evenly since centered text can fall anywhere across the width.
export const AZURE_SCRIM =
  'bg-[linear-gradient(105deg,_oklch(0.2_0.06_250_/_0.92)_0%,_oklch(0.35_0.12_250_/_0.72)_55%,_oklch(0.45_0.14_250_/_0.4)_100%)]';
export const AZURE_SCRIM_RIGHT =
  'bg-[linear-gradient(255deg,_oklch(0.2_0.06_250_/_0.92)_0%,_oklch(0.35_0.12_250_/_0.72)_55%,_oklch(0.45_0.14_250_/_0.4)_100%)]';
export const AZURE_SCRIM_CENTER = 'bg-[oklch(0.2_0.06_250_/_0.88)]';

export const NEUTRAL_SCRIM =
  'bg-[linear-gradient(105deg,_oklch(0.18_0.01_250_/_0.9)_0%,_oklch(0.26_0.015_250_/_0.68)_55%,_oklch(0.32_0.02_250_/_0.4)_100%)]';
export const NEUTRAL_SCRIM_RIGHT =
  'bg-[linear-gradient(255deg,_oklch(0.18_0.01_250_/_0.9)_0%,_oklch(0.26_0.015_250_/_0.68)_55%,_oklch(0.32_0.02_250_/_0.4)_100%)]';
export const NEUTRAL_SCRIM_CENTER = 'bg-[oklch(0.18_0.01_250_/_0.86)]';
