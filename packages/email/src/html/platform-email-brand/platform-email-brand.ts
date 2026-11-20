import type { TEmailLogoImage } from '@shinefold/email/html/email-header/email-header';
import { EMAIL_WHITE } from '@shinefold/email/html/email-metrics/email-metrics';
import { oklchToHex } from '@shinefold/utils/color';
import {
  SHINEFOLD_LOGO_COLOR,
  SHINEFOLD_LOGO_NAME,
} from '@shinefold/utils/shinefold-logo';

// Email clients can't read CSS custom properties, so the neutrals mirror
// `configs/tailwind/theme.css`'s light-mode `:root` OKLCH values as static hex.
export const PLATFORM_EMAIL_BRAND = {
  surface: EMAIL_WHITE,
  surface2: oklchToHex(0.975, 0.003, 250),
  border: oklchToHex(0.9, 0.004, 250),
  text: SHINEFOLD_LOGO_COLOR.INK,
  textMuted: oklchToHex(0.46, 0.01, 250),
  brandPrimary: SHINEFOLD_LOGO_COLOR.INK,
  brandPrimarySolid: SHINEFOLD_LOGO_COLOR.INK,
  brandPrimaryContrast: EMAIL_WHITE,
  surfaceHead: '#eef1f6',
  warn: '#9a3d0b',
  bad: '#b42318',
} as const;

type TPlatformEmailBrand = Record<keyof typeof PLATFORM_EMAIL_BRAND, string>;

const PLATFORM_DARK_BG = '#0f1115';

// Mirrors the dark tokens in `apps/platform`'s `platform-theme.css`; the usage colours above mirror its light ones.
export const PLATFORM_EMAIL_DARK_BRAND: TPlatformEmailBrand = {
  surface: '#171a20',
  surface2: PLATFORM_DARK_BG,
  border: '#2b303a',
  text: SHINEFOLD_LOGO_COLOR.PAPER,
  textMuted: '#a3abb8',
  brandPrimary: SHINEFOLD_LOGO_COLOR.YELLOW,
  brandPrimarySolid: SHINEFOLD_LOGO_COLOR.YELLOW,
  brandPrimaryContrast: PLATFORM_DARK_BG,
  surfaceHead: '#1d2027',
  warn: '#ffa066',
  bad: '#fca5a0',
};

export const PLATFORM_EMAIL_BRAND_NAME = SHINEFOLD_LOGO_NAME;

const PLATFORM_EMAIL_IMAGE_BASE_URL =
  'https://9g0lu6877s8zu2lj.public.blob.vercel-storage.com/images';

// Gmail and Outlook strip inline SVG, so the logo is a hosted 2x PNG drawn at half its pixel size.
export const PLATFORM_EMAIL_FULL_LOGO: TEmailLogoImage = {
  url: `${PLATFORM_EMAIL_IMAGE_BASE_URL}/shinefold-logo-dark-v2-2x.png`,
  width: 176,
  height: 56,
  alt: PLATFORM_EMAIL_BRAND_NAME,
};

export const PLATFORM_EMAIL_MARK: TEmailLogoImage = {
  url: `${PLATFORM_EMAIL_IMAGE_BASE_URL}/shinefold-mark-v1-2x.png`,
  width: 32,
  height: 32,
  alt: PLATFORM_EMAIL_BRAND_NAME,
};
