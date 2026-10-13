import { renderEmailShell } from '@blog/email/html/email-layout/email-layout';
import { oklchToHex } from '@blog/utils/color';

export const NEUTRAL_EMAIL_PALETTE = {
  surface: oklchToHex(1, 0, 0),
  surface2: oklchToHex(0.975, 0, 0),
  border: oklchToHex(0.9, 0, 0),
  text: oklchToHex(0.2, 0, 0),
  textMuted: oklchToHex(0.46, 0, 0),
  brandPrimary: oklchToHex(0.3, 0, 0),
  brandPrimarySolid: oklchToHex(0.25, 0, 0),
  brandPrimaryContrast: oklchToHex(0.99, 0, 0),
} as const;

export type TBuildNeutralShellInput = {
  title: string;
  previewText?: string;
  bodyHtml: string;
  structuralHtml?: string;
  actionHtml?: string;
};

/**
 * Wraps tenant-facing mail whose tenant could not be resolved: achromatic,
 * and carrying no brand name, so it can claim neither a tenant's identity
 * nor the operator's.
 */
export function buildNeutralShell({
  title,
  previewText,
  bodyHtml,
  structuralHtml,
  actionHtml,
}: TBuildNeutralShellInput): string {
  return renderEmailShell({
    palette: NEUTRAL_EMAIL_PALETTE,
    title,
    previewText,
    bodyHtml,
    structuralHtml,
    actionHtml,
  });
}
