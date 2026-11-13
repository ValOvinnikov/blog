import type { TEmailLogoImage } from '@blog/email/html/email-header/email-header';
import { oklchToHex } from '@blog/utils/color';
import { SHINEFOLD_LOGO_COLOR } from '@blog/utils/shinefold-logo';

// Email clients can't read CSS custom properties, so the neutrals mirror
// `configs/tailwind/theme.css`'s light-mode `:root` OKLCH values as static hex.
export const PLATFORM_EMAIL_BRAND = {
  surface: oklchToHex(1, 0, 0),
  surface2: oklchToHex(0.975, 0.003, 250),
  border: oklchToHex(0.9, 0.004, 250),
  text: SHINEFOLD_LOGO_COLOR.INK,
  textMuted: oklchToHex(0.46, 0.01, 250),
  brandPrimary: SHINEFOLD_LOGO_COLOR.INK,
  brandPrimarySolid: SHINEFOLD_LOGO_COLOR.INK,
  brandPrimaryContrast: oklchToHex(1, 0, 0),
} as const;

export const PLATFORM_EMAIL_BRAND_NAME = 'Shinefold';

const PLATFORM_EMAIL_IMAGE_BASE_URL =
  'https://9g0lu6877s8zu2lj.public.blob.vercel-storage.com/images';

// Gmail and Outlook strip inline SVG, so the logo is a hosted 2x PNG drawn at half its pixel size.
export const PLATFORM_EMAIL_FULL_LOGO: TEmailLogoImage = {
  url: `${PLATFORM_EMAIL_IMAGE_BASE_URL}/shinefold-logo-dark-v1-2x.png`,
  width: 152,
  height: 32,
  alt: PLATFORM_EMAIL_BRAND_NAME,
};

export const PLATFORM_EMAIL_MARK: TEmailLogoImage = {
  url: `${PLATFORM_EMAIL_IMAGE_BASE_URL}/shinefold-mark-v1-2x.png`,
  width: 32,
  height: 32,
  alt: PLATFORM_EMAIL_BRAND_NAME,
};
