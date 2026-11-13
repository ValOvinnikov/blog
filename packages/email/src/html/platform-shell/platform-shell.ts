import { renderEmailShell } from '@blog/email/html/email-layout/email-layout';
import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_FULL_LOGO,
} from '@blog/email/html/platform-email-brand/platform-email-brand';

export type TBuildPlatformShellInput = {
  brandName: string;
  title: string;
  previewText?: string;
  bodyHtml: string;
  structuralHtml?: string;
  actionHtml?: string;
};

/** Wraps mail the platform sends in its own name; no tenant palette or logo can reach it. */
export function buildPlatformShell({
  brandName,
  title,
  previewText,
  bodyHtml,
  structuralHtml,
  actionHtml,
}: TBuildPlatformShellInput): string {
  return renderEmailShell({
    palette: PLATFORM_EMAIL_BRAND,
    title,
    identity: {
      brandName,
      logo: {
        fullLogoImage: PLATFORM_EMAIL_FULL_LOGO,
        groundColor: PLATFORM_EMAIL_BRAND.brandPrimarySolid,
        altTextColor: PLATFORM_EMAIL_BRAND.brandPrimaryContrast,
      },
    },
    previewText,
    bodyHtml,
    structuralHtml,
    actionHtml,
  });
}
